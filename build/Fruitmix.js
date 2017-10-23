const Promise = require('bluebird')
const path = require('path')
const fs = Promise.promisifyAll(require('fs'))
const EventEmitter = require('events')
const crypto = require('crypto')
const dgram = require('dgram')

const rimraf = require('rimraf')
const mkdirp = require('mkdirp')
const mkdirpAsync = Promise.promisify(mkdirp)
const rimrafAsync = Promise.promisify(rimraf)

const UUID = require('uuid')

const UserList = require('./user/user')
const DriveList = require('./forest/forest')
const BoxData = require('./box/boxData')
const Thumbnail = require('./lib/thumbnail2')
const File = require('./forest/file')
const Identifier = require('./lib/identifier')
const { btrfsConcat, btrfsClone } = require('./lib/btrfs')
const jwt = require('jwt-simple')
const secret = require('./config/passportJwt')

const { assert, isUUID, isSHA256, validateProps } = require('./common/assertion')

const CopyTask = require('./tasks/fruitcopy')
const MoveTask = require('./tasks/fruitmove')

const { readXstat, forceXstat } = require('./lib/xstat')
const samba = require('./samba/server')

const Debug = require('debug')
const smbDebug = Debug('samba')
const debug = Debug('fruitmix')

const combineHash = (a, b) => {
  let a1 = typeof a === 'string' ? Buffer.from(a, 'hex') : a
  let b1 = typeof b === 'string' ? Buffer.from(b, 'hex') : b
  let hash = crypto.createHash('sha256')
  hash.update(Buffer.concat([a1, b1]))
  let digest = hash.digest('hex')
  return digest
}

const nosmb = !!process.argv.find(arg => arg === '--disable-smb') || process.env.NODE_PATH !== undefined

/**
Fruitmix is the facade of internal modules, including user, drive, forest, and box.

Fruitmix is responsible for authorization, but not authentication.

Station module and all routers consumes only Fruitmix API. They are NOT allowed to
bypass the facade to access the internal modules.

Fruitmix is also responsible for initialize all internal modules and paths.
*/
class Fruitmix extends EventEmitter {

  /**
  @params {string} froot - fruitmix root path, should be an normalized absolute path
  */
  constructor (froot, opt) {
    super()
    let thumbDir = path.join(froot, 'thumbnail')
    let tmpDir = path.join(froot, 'tmp')

    this.fruitmixPath = froot
    this.mediaMap = this.loadMediaMap(path.join(froot, 'metadataDB.json'))
    this.thumbnail = new Thumbnail(thumbDir, tmpDir)
    this.userList = new UserList(froot)
    this.driveList = new DriveList(froot, this.mediaMap)
    this.boxData = new BoxData(froot)
    this.tasks = []
    this.storeTimer = setInterval(() => {
      this.storeMediaMapAsync()
        .then(() => {})
        .catch(e => {})
    }, 1000 * 60 * 60)

    if (!nosmb) {
      samba.start(froot)
      let udp = dgram.createSocket('udp4')
      udp.on('listening', () => {
        const a = udp.address()
        console.log(`fruitmix udp listening ${a.address}:${a.port}`)
      })

      udp.on('message', (message, rinfo) => {
        const token = ' smbd_audit: '

        let text = message.toString()
        // SAMBA_AUDIT(text)
        //
        // enter into folder 'aaa', then create a new file named 'bbb', then edit it.
        //
        // samba audit like below:
        // <185>Jun 16 11:01:14 wisnuc-virtual-machine smbd_audit: root|a|a (home)|/run/wisnuc/volumes/56b.../wisnuc/fruitmix/drives/21b...|create_file|ok|0x100080|file|open|aaa/bbb.txt
        //
        // arr[0]: root
        // arr[1]: a
        // arr[2]: a (home)
        // arr[3]: /run/wisnuc/volumes/56b.../wisnuc/fruitmix/drives/21b...
        // arr[4]: create_file
        // arr[5]: ok
        // arr[6]: 0x100080
        // arr[7]: file
        // arr[8]: open
        // arr[9]: aaa/bbb.txt
        //
        // user: a
        // share: a (home)
        // abspath: /run/wisnuc/volumes/56b.../wisnuc/fruitmix/drives/21b...
        // op: create_file

        let tidx = text.indexOf(' smbd_audit: ')
        if (tidx === -1) return

        let arr = text.trim().slice(tidx + token.length).split('|')

        // for(var i = 0; i < arr.length; i++){
        //   SAMBA_AUDIT(`arr[${i}]: ` + arr[i])
        // }

        // %u <- user
        // %U <- represented user
        // %S <- share
        // %P <- path

        if (arr.length < 6 || arr[0] !== 'root' || arr[5] !== 'ok') return

        let user = arr[1]
        let share = arr[2]
        let abspath = arr[3]
        let op = arr[4]
        let arg0, arg1

        // create_file arg0
        // mkdir arg0
        // rename arg0 arg1 (file or directory)
        // rmdir arg0 (delete directory)
        // unlink arg0 (delete file)
        // write (not used anymore)
        // pwrite

        switch (op) {
          case 'create_file':
            if (arr.length !== 10) return
            if (arr[8] !== 'create') return
            if (arr[7] !== 'file') return
            arg0 = arr[9]
            break

          case 'mkdir':
          case 'rmdir':
          case 'unlink':
          case 'pwrite':
            if (arr.length !== 7) return
            arg0 = arr[6]
            break

          case 'rename':
            if (arr.length !== 8) return
            arg0 = arr[6]
            arg1 = arr[7]
            break

          case 'close':
            if (arr.lenght !== 7) return
            arg0 = arr[6]
            break

          default:
            return
        }

        let audit = { user, share, abspath, op, arg0 }
        if (arg1) audit.arg1 = arg1

        smbDebug(audit)

        this.driveList.audit(abspath, arg0, arg1)
      })

      udp.on('error', err => {
        console.log('fruitmix udp server error', err)
        // should restart with back-off TODO
        udp.close()
      })

      udp.bind('3721', '127.0.0.1')
    }
  }

  loadMediaMap (fpath) {
    let medias, data
    try {
      medias = fs.readFileSync(fpath, { encoding: 'utf8' }).split('\n').filter(x => !!x.length)
    } catch (e) {
      rimraf.sync(fpath) // remove
      medias = []
    }
    let mediaMap = new Map()
    medias.forEach(x => {
      try {
        data = JSON.parse(x)
        if (data.length === 2) {
          mediaMap.set(data[0], data[1])
        }
      } catch (e) { } // TODO:
    })
    return mediaMap
  }

  async storeMediaMapAsync () {
    let tmp = path.join(this.fruitmixPath, 'tmp', UUID.v4())
    let fpath = path.join(this.fruitmixPath, 'metadataDB.json')
    let metadata = Array.from(this.mediaMap).map(x => {
      try {
        return JSON.stringify(x)
      } catch (e) {
        debug(e)
      }
    })
    try {
      await fs.writeFileAsync(tmp, metadata.join('\n'))
      await rimrafAsync(fpath)
      await fs.renameAsync(tmp, fpath)
    } catch (e) {
      debug(e)
      throw e
    }
  }

  /**

  */
  hasUsers () {
    return this.userList.users.length !== 0
  }

  /**
  This function returns a list of users with minimal attributes.
  */
  displayUsers () {
    return this.userList.users.map(u => ({
      uuid: u.uuid,
      username: u.username,
      avatar: u.avatar,
      disabled: u.disabled
    }))
  }

  getUsers () {
    return this.userList.users.map(u => ({
      uuid: u.uuid,
      username: u.username,
      isFirstUser: u.isFirstUser,
      isAdmin: u.isAdmin,
      avatar: u.avatar,
      global: u.global,
      disabled: u.disabled
    }))
  }

  getToken (user) {
    return {
      type: 'JWT',
      token: jwt.encode({ uuid: user.uuid }, secret)
    }
  }

  /**
  {
    uuid:         // not allowed to change
    username:     // allowed
    password:     // allowed
    isFirstUser:  // not allowed to change
    isAdmin:      // allowed
    avatar:       // not allowed to change
    global:       // allowed
    disabled:     // allowed
  }

  If  userUUID is itself (superuser, admin, common user)
    allowed: username, global, password, 
  If user is super user, userUUID is not itself
    allowed: isAdmin, username, password, global, disabled
  if user is admin 
    allowed: username, password, global, disabled
  if user is common user
    only can change itself
  */ 
  userCanUpdate (user, userUUID, props) {
    let u = this.findUserByUUID(userUUID) // is operated
    if (!user || !userUUID) throw Object.assign(new Error('user not found'), { status: 404 })
    if (props === undefined || (Array.isArray(props) && props.length === 0)) return true
    // 'uuid', 'isFirstUser', 'avatar' can not be change
    let recognized = [
      'username', 'password', 'isAdmin', 'global', 'disabled'
    ]

    Object.getOwnPropertyNames(props).forEach(name => {
      if (!recognized.includes(name)) {
        throw Object.assign(new Error(`unrecognized prop name ${name}`), { status: 400 })
      }
    })

    let disallowed

    if (user.uuid === userUUID) {
      disallowed = [ 'isAdmin', 'disabled' ]
    } else {
      if (user.isFirstUser) return true
      else if (user.isAdmin) {
        if (u.isAdmin) return false // admin and isFirstUser
        disallowed = ['isAdmin']
      } else return false // common user
    }

    Object.getOwnPropertyNames(props).forEach(name => {
      if (disallowed.includes(name)) {
        throw Object.assign(new Error(`unrecognized prop name ${name}`), { status: 403 })
      }
    })
    return true
  }

  /**
   * 1 own drives
   * 2 public drive (writelist or readlist)
   * @param {*} user 
   * @param {*} dirUUID 
   */
  userCanRead (user, dirUUID) {
    if (!user || !dirUUID || !dirUUID.length) throw Object.assign(new Error('Invalid parameters'), { status: 400 })
    if (!this.driveList.uuidMap.has(dirUUID)) { throw Object.assign(new Error('drive not found'), { status: 404 }) }
    let drive = this.driveList.uuidMap.get(dirUUID)
    let rootDrive = drive.root()
    let userDrives = this.getDrives(user)
    if (userDrives.findIndex(d => d.uuid === rootDrive.uuid) !== -1) return true
    return false
  }

  // write maybe upload, (remove??)
  // 1 own drives
  // 2 public drive && (writelist or (readlist&& admin))
  userCanWrite (user, dirUUID) {
    if (!user || !dirUUID || !dirUUID.length) throw Object.assign(new Error('Invalid parameters'), { status: 400 })
    if (!this.driveList.uuidMap.has(dirUUID)) { throw Object.assign(new Error('drive not found'), { status: 404 }) }
    let drive = this.driveList.uuidMap.get(dirUUID)
    let rootDrive = drive.root()

    let userDrives = this.driveList.drives.filter(drv => {
      if (drv.type === 'private' && drv.owner === user.uuid) return true
      if (drv.type === 'public' && ((drv.writelist.includes(user.uuid)) ||
        (drv.readlist.includes(user.uuid) && user.isAdmin))) return true
      return false
    })

    if (userDrives.findIndex(d => d.uuid === rootDrive.uuid) !== -1) return true
    return false
  }

  userCanReadMedia (user, fingerprint) {
    if (!user || !fingerprint || !fingerprint.length) throw Object.assign(new Error('Invalid parameters'), { status: 400 })
    if (!this.driveList.hashMap.has(fingerprint)) { throw Object.assign(new Error('media not found'), { status: 404 }) }
    let medias = Array.from(this.driveList.hashMap.get(fingerprint))
    let userDrives = this.getDrives(user).map(d => d.uuid)
    if (medias.find(media => userDrives.indexOf(media.root().uuid) !== -1)) { return true }
    return false
  }

  /**
   * if no user: create first user 
   * if first user : recognized -> ['isAdmin', 'username', 'password',  'global', 'disabled']
   * if admin : recognized -> [ 'username', 'password', 'global', 'disabled']
   * if common user return 403
  */
  async createUserAsync (user, props) {
    if (!user && this.hasUsers()) throw Object.assign(new Error('user not found'), { status: 400 })
    if (user && !user.isAdmin) throw Object.assign(new Error('permission denied'), { status: 403 })
    let recognized = ['username', 'password', 'global', 'disabled']
    if (!user || user.isFirstUser) {
      recognized.push('isAdmin') // super user
      let index = recognized.indexOf('disabled')
      recognized = [...recognized.slice(0, index), ...recognized.slice(index + 1)]
    }
    Object.getOwnPropertyNames(props).forEach(name => {
      if (!recognized.includes(name)) {
        throw Object.assign(new Error(`unrecognized prop name ${name}`), { status: 400 })
      }
    })

    let u = await this.userList.createUserAsync(props)
    await this.driveList.createPrivateDriveAsync(u.uuid, 'home')
    return u
  }

  /**
  */
  userUpdatePassword () {
    this.User.updatePassword()
  }

  verifyUserPassword (userUUID, password, done) {
    this.userList.verifyPassword(userUUID, password, done)
  }

  findUserByUUID (userUUID) {
    return this.userList.findUser(userUUID)
  }

  findUserByGUID (guid) {
    let user = this.userList.users.find(u => u.global && u.global.id === guid)
    return user
  }
  /**
  isFirstUser never allowed to change.
  possibly allowed props: username, isAdmin, global

  {
    uuid:         // not allowed to change
    username:     // allowed
    password:     // allowed
    isFirstUser:  // not allowed to change
    isAdmin:      // allowed
    avatar:       // not allowed to change
    global:       // allowed
  }

  If user is super user, userUUID is itself
    allowed: username, global
  If user is super user, userUUID is not itself
    allowed: isAdmin, 
  */ 
  async updateUserAsync (user, userUUID, body) {
    if (!this.userCanUpdate(user, userUUID, body)) { throw Object.assign(new Error(`unrecognized prop name `), { status: 400 }) }
    if (Object.getOwnPropertyNames(body).includes('password')) { throw Object.assign(new Error(`password is not allowed to change`), { status: 403 }) }
    return this.userList.updateUserAsync(userUUID, body)
  }

  async updateUserPasswordAsync (user, userUUID, body) {
    if (!user || user.uuid !== userUUID) throw Object.assign(new Error('user or uuid error'), { status: 400 })

    if (typeof body.password !== 'string') {
      throw Object.assign(new Error('bad format'), { status: 400 })
    }

    await this.userList.updatePasswordAsync(user.uuid, body.password)
  }

  async updateUserGlobalAsync (user, userUUID, body) {
    if (!body.global || typeof body.global !== 'object') { throw Object.assign(new Error('global format error'), { status: 400 }) }

    if (!body.global.id || typeof body.global.id !== 'string') { throw Object.assign(new Error('global.id format error'), { status: 400 }) }

    if (!body.global.wx || !(body.global.wx instanceof Array) || !body.global.wx.length) { throw Object.assign(new Error('global.wx format error'), { status: 400 }) }

    let props = Object.assign({}, { global: body.global })
    return this.userList.updateUserAsync(userUUID, props)
  }

  async getMediaBlacklistAsync (user) {
    let dirPath = path.join(this.fruitmixPath, 'users', user.uuid)
    await mkdirpAsync(dirPath)
    try {
      let filePath = path.join(this.fruitmixPath, 'users', user.uuid, 'media-blacklist.json')
      let list = JSON.parse(await fs.readFileAsync(filePath))
      return list
    } catch (e) {
      if (e.code === 'ENOENT' || e instanceof SyntaxError) return []
      throw e
    }
  }

  async setMediaBlacklistAsync (user, props) {
    // TODO must all be sha256 value

    if (!Array.isArray(props) || !props.every(x => isSHA256(x))) {
      throw Object.assign(new Error('invalid parameters'),
        { status: 400 })
    }

    let dirPath = path.join(this.fruitmixPath, 'users', user.uuid)
    await mkdirpAsync(dirPath)
    let filePath = path.join(this.fruitmixPath, 'users', user.uuid, 'media-blacklist.json')
    await fs.writeFileAsync(filePath, JSON.stringify(props))
  }

  async addMediaBlacklistAsync (user, props) {
    if (!Array.isArray(props) || !props.every(x => isSHA256(x))) {
      throw Object.assign(new Error('invalid parameters'),
        { status: 400 })
    }

    let dirPath = path.join(this.fruitmixPath, 'users', user.uuid)
    await mkdirpAsync(dirPath)

    let filePath, list
    try {
      filePath = path.join(this.fruitmixPath, 'users', user.uuid, 'media-blacklist.json')
      list = JSON.parse(await fs.readFileAsync(filePath))
    } catch (e) {
      if (e.code === 'ENOENT' || e instanceof SyntaxError) {
        list = []
      } else {
        throw e
      }
    }

    let merged = Array.from(new Set([...list, ...props]))
    await fs.writeFileAsync(filePath, JSON.stringify(merged))
    return merged
  }

  async subtractMediaBlacklistAsync (user, props) {
    if (!Array.isArray(props) || !props.every(x => isSHA256(x))) {
      throw Object.assign(new Error('invalid parameters'),
        { status: 400 })
    }

    let dirPath = path.join(this.fruitmixPath, 'users', user.uuid)
    await mkdirpAsync(dirPath)

    let filePath, list
    try {
      filePath = path.join(this.fruitmixPath, 'users', user.uuid, 'media-blacklist.json')
      list = JSON.parse(await fs.readFileAsync(filePath))
    } catch (e) {
      if (e.code === 'ENOENT' || e instanceof SyntaxError) {
        list = []
      } else {
        throw e
      }
    }

    let set = new Set(props)
    let subtracted = list.filter(x => !set.has(x))
    await fs.writeFileAsync(filePath, JSON.stringify(subtracted))
    return subtracted
  }

  getDrives (user) {
    let drives = this.driveList.drives.filter(drv => {
      if (drv.type === 'private' && drv.owner === user.uuid) return true
      if (drv.type === 'public' &&
        (drv.writelist.includes(user.uuid) || drv.readlist.includes(user.uuid))) {
        return true
      }
      return false
    })

    return drives
  }

  getDriveList (user) {
    let drives = this.driveList.drives.filter(drv => {
      if (drv.type === 'private' && drv.owner === user.uuid) return true
      if (drv.type === 'public' &&
        (drv.writelist.includes(user.uuid) || drv.readlist.includes(user.uuid) || user.isAdmin)) {
        return true
      }
      return false
    })

    return drives
  }

  async createPublicDriveAsync (user, props) {
    if (!user) throw Object.assign(new Error('Invaild user'), { status: 400 })
    if (!user.isAdmin) { throw Object.assign(new Error(`requires admin priviledge`), { status: 403 }) }

    return this.driveList.createPublicDriveAsync(props)
  }

  getDrive (user, driveUUID) {
    if (!this.userCanRead(user, driveUUID)) throw Object.assign(new Error('permission denied'), { status: 403 })

    let drive = this.driveList.drives.find(drv => drv.uuid === driveUUID)
    if (!drive) { throw Object.assign(new Error(`drive ${driveUUID} not found`), { status: 404 }) }

    return drive
  }

  /**
    uuid, type, writelist, readlist, label 
  */
  async updatePublicDriveAsync (user, driveUUID, props) {
    if (!user.isAdmin) {
      throw Object.assign(new Error(`requires admin priviledge`), { status: 403 })
    }

    let drive = this.driveList.drives.find(drv => drv.uuid === driveUUID)
    if (!drive) {
      throw Object.assign(new Error(`drive ${driveUUID} not found`), { status: 404 })
    }

    if (drive.type === 'private') {
      throw Object.assign(new Error(`private drive is not allowed to update`), { status: 403 })
    }

    let recognized = ['uuid', 'type', 'writelist', 'readlist', 'label']
    Object.getOwnPropertyNames(props).forEach(name => {
      if (!recognized.includes(name)) {
        throw Object.assign(new Error(`unrecognized prop name ${name}`), { status: 400 })
      }
    })

    let disallowed = ['uuid', 'type', 'readlist']
    Object.getOwnPropertyNames(props).forEach(name => {
      if (disallowed.includes(name)) {
        throw Object.assign(new Error(`${name} is not allowed to update`), { status: 403 })
      }
    })

    if (props.writelist) {
      let wl = props.writelist
      if (!Array.isArray(wl)) {
        throw Object.assign(new Error(`writelist must be an uuid array`), { status: 400 })
      }

      if (!wl.every(uuid => !!this.userList.users.find(u => u.uuid === uuid))) {
        throw Object.assign(new Error(`not all user uuid found`), { status: 400 })
      }

      props.writelist = Array.from(new Set(props.writelist)).sort()
    }

    return this.driveList.updatePublicDriveAsync(driveUUID, props)
  }

  getDriveDirs (user, driveUUID) {
    // FIXME should this 401 ?
    if (!this.userCanRead(user, driveUUID)) throw Object.assign(new Error('Permission Denied'), { status: 401 })
    return this.driveList.getDriveDirs(driveUUID)
  }

  async getDriveDirAsync (user, driveUUID, dirUUID, metadata) {
    // FIXME should this 401 ?
    if (!this.userCanRead(user, driveUUID)) throw Object.assign(new Error('Permission Denied'), { status: 401 })
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) throw Object.assign(new Error('drive or dir not found'), { status: 404 })

    let path = dir.nodepath().map(dir => ({
      uuid: dir.uuid,
      name: dir.name,
      mtime: Math.abs(dir.mtime)
    }))

    let entries = await dir.readdirAsync()
    if (metadata) {
      entries.forEach(entry => {
        if (entry.type === 'file' && entry.magic === 'JPEG' && entry.hash) {
          entry.metadata = this.mediaMap.get(entry.hash)
        }
      })
    }

    return { path, entries }
  }

  // this is slightly different from async versoin
  getDriveDir (user, driveUUID, dirUUID, opts, callback) {
    // FIXME user permission check
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      process.nextTick(() => callback(err))
    } else {
      dir.read(callback)
    }
  }

  getDriveDirPath (user, driveUUID, dirUUID) {
    // FIXME should this 401 ?
    if (!this.userCanRead(user, driveUUID)) throw Object.assign(new Error('Permission Denied'), { status: 401 })

    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) throw Object.assign(new Error('not found'), { status: 404 })
    return dir.abspath()
  }

  // async or sync ??? TODO
  getDriveFilePath (user, driveUUID, dirUUID, fileUUID, name) {

  }

  getTmpDir () {
    return path.join(this.fruitmixPath, 'tmp')
  }

  /// ////////////// box api ///////////////////////

  /**
   * get all box descriptions user can access
   * @param {Object} user
   * @return {array} a docList of boxes user can view
   */
  getAllBoxes (user) {
    let guid = user.global.id
    return this.boxData.getAllBoxes(guid)
  }

  // return a box doc
  /**
   * get a box description
   * @param {Object} user
   * @param {string} boxUUID - uuid of box
   */
  getBox (user, boxUUID) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    let doc = box.doc
    if (doc.owner !== guid && !doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }
    return doc
  }

  // props {name, users:[]}
  /**
   * create a new box
   * @param {Object} user 
   * @param {Object} props
   * @param {string} props.name - name of box to be created
   * @param {array} props.users - collection of global ID string
   * @return {Object} box description (doc)
   */
  async createBoxAsync (user, props) {
    let u = this.findUserByUUID(user.uuid)
    if (!u || user.global.id !== u.global.id) { throw Object.assign(new Error('no permission'), { status: 403 }) }
    validateProps(props, ['name', 'users'])
    assert(typeof props.name === 'string', 'name should be a string')
    assert(Array.isArray(props.users), 'users should be an array')
    // FIXME: check user global ID in props.users ?

    props.owner = user.global.id
    return this.boxData.createBoxAsync(props)
  }

  // update name and users, only box owner is allowed
  // props {name, users: {op: add/delete, value: [user global ID]}}
  /**
   * update a box, name, users or mtime
   * @param {Object} user 
   * @param {string} boxUUID - uuid of box to be updated
   * @param {Object} props
   * @param {string} props.name - optional, new name of box
   * @param {Object} props.users - optional, {op: add/delete, value: [user global ID]}
   * @param {number} props.mtime - optional
   * @return {Object} new description of box
   */
  async updateBoxAsync (user, boxUUID, props) {
    let u = this.findUserByUUID(user.uuid)
    if (!u || user.global.id !== u.global.id) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    if (box.doc.owner !== user.global.id) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    validateProps(props, [], ['name', 'users', 'mtime'])
    if (props.name) assert(typeof props.name === 'string', 'name should be a string')
    if (props.users) {
      assert(typeof props.users === 'object', 'users should be an object')
      assert(props.users.op === 'add' || props.users.op === 'delete', 'operation should be add or delete')
      assert(Array.isArray(props.users.value), 'value should be an array')
    }

    return this.boxData.updateBoxAsync(props, boxUUID)
  }

  /**
   * delete a box, only box owner is allowed
   * @param {Object} user 
   * @param {string} boxUUID 
   */
  async deleteBoxAsync (user, boxUUID) {
    let u = this.findUserByUUID(user.uuid)
    if (!u || user.global.id !== u.global.id) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    if (box.doc.owner !== user.global.id) { throw Object.assign(new Error('no permission'), { status: 403 }) }
    return this.boxData.deleteBoxAsync(boxUUID)
  }

  /**
   * get all branches
   * @param {Object} user 
   * @param {string} boxUUID 
   * @return {array} a list of branch descriptions
   */
  async getAllBranchesAsync (user, boxUUID) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.retrieveAllAsync('branches')
  }

  /**
   * get a branch information
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {string} branchUUID 
   * @return {Object} branch information
   */
  async getBranchAsync (user, boxUUID, branchUUID) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    if (!isUUID(branchUUID)) throw Object.assign(new Error('invalid branchUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.retrieveAsync('branches', branchUUID)
  }

  // props {name, head}
  /**
   * create a new branch
   * @param {Object} user 
   * @param {string} boxUUID
   * @param {Object} props 
   * @param {string} props.name - branch name
   * @param {string} props.head - sha256, a commit hash
   * @return {object} description of branch
   */
  async createBranchAsync (user, boxUUID, props) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    validateProps(props, ['name', 'head'])
    assert(typeof props.name === 'string', 'name should be a string')
    assert(isSHA256(props.head), 'head should be a sha256')

    return box.createBranchAsync(props)
  }

  // props {name, head}
  /**
   * updata a branch, name or head
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {string} branchUUID 
   * @param {Object} props 
   * @param {string} props.name - new name of branch
   * @param {string} props.head - sha256, new commit hash
   * @return {Object} new description of branch
   */
  async updateBranchAsync (user, boxUUID, branchUUID, props) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    if (!isUUID(branchUUID)) throw Object.assign(new Error('invalid branchUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    validateProps(props, [], ['name', 'head'])
    if (props.name) assert(typeof props.name === 'string', 'name should be a string')
    if (props.head) assert(isSHA256(props.head), 'head should be a sha256')

    return box.updateBranchAsync(branchUUID, props)
  }

  async deleteBranchAsync (user, boxUUID, branchUUID) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    if (!isUUID(branchUUID)) throw Object.assign(new Error('invalid branchUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.deleteBranchAsync(branchUUID)
  }

  // props {first, last, count, segments}
  /**
   * get appointed segments
   * segments: '3:5|7:10|20:30'
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {Object} props
   * @param {number} props.first - optional, the first index of segment user hold 
   * @param {number} props.last - optional, the last index of segment user hold
   * @param {number} props.count - optional, number of records user want to get
   * @param {string} props.segments - optional, segments of records user want to get
   */
  async getTweetsAsync (user, boxUUID, props) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    validateProps(props, [], ['first', 'last', 'count', 'segments'])
    if (props.first) assert(Number.isInteger(props.first), 'first should be an integer')
    if (props.last) assert(Number.isInteger(props.last), 'last should be an integer')
    if (props.count) assert(Number.isInteger(props.count), 'count should be an integer')
    if (props.last) assert(typeof props.segments === 'string', 'segments should be a string')

    return box.getTweetsAsync(props)
  }

  /**
   * 
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {Object} props
   * @param {string} props.comment
   * @param {string} props.type - blob, list, branch, commit, job, tag
   * @param {string} props.id - sha256 or uuid, for blob, branch, commit, job, tag
   * @param {array} props.list - [{sha256, filename}], only for list
   * @param {Object} props.global - user global object
   * @param {array} props.path - {sha256, filepath}, for blob and list
   * @return {Object} tweet object
   */
  async createTweetAsync (user, boxUUID, props) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let global = user.global
    if (box.doc.owner !== global.id && !box.doc.users.includes(global.id)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    props.global = global

    validateProps(props, ['global', 'comment'], ['type', 'id', 'list', 'src'])
    assert(typeof props.comment === 'string', 'comment should be a string')
    assert(typeof props.global === 'object', 'global should be an object')
    if (props.type) assert(typeof props.type === 'string', 'type should be a string')
    if (props.id) assert(isSHA256(props.id) || isUUID(props.id), 'id should be sha256 or uuid')
    if (props.list) assert(Array.isArray(props.list), 'list should be an array')
    if (props.src) assert(Array.isArray(props.src), 'src should be an array')

    let result = await box.createTweetAsync(props)
    await this.boxData.updateBoxAsync({mtime: result.mtime}, boxUUID)
    return result.tweet
  }

  /**
   * delete tweets
   * add tweetsID into blacklist
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {array} tweetsID - list of tweets ID to be deleted
   */
  async deleteTweetsAsync (user, boxUUID, tweetsID) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.deleteTweetsAsync(tweetsID)
  }

  /// ////////// media api //////////////

  getMetaList (user) {
    if (!user) throw Object.assign(new Error('Invaild user'), { status: 400 })
    let drives = this.getDrives(user)
    let m = new Map()
    drives.forEach(drive => {
      let root = this.driveList.roots.get(drive.uuid)
      if (!root) return []
      root.preVisit(node => {
        if (node instanceof File && this.mediaMap.has(node.hash)) { m.set(node.hash, Object.assign({}, this.mediaMap.get(node.hash), { hash: node.hash })) }
      })
    })
    return Array.from(m.values())
  }

  // NEW API
  getMetadata (user, fingerprint) {
    if (!this.userCanReadMedia(user, fingerprint)) { throw Object.assign(new Error('permission denied'), { status: 401 }) }
    return Object.assign({}, this.mediaMap.get(fingerprint), { hash: fingerprint })
  }

  getFingerprints (user, ...args) {
    // TODO: drive?
    return this.driveList.getFingerprints(...args)
  }

  getFilesByFingerprint (user, fingerprint) {
    if (!this.userCanReadMedia(user, fingerprint)) throw Object.assign(new Error('permission denied'), { status: 401 })
    return this.driveList.getFilesByFingerprint(fingerprint)
  }

  // return a file path, or a function, the function can be called again and returns a 
  // cancel function
  /**
  async getThumbnailAsync (user, fingerprint, query) {
    let files = this.getFilesByFingerprint(user, fingerprint)
    if (files.length) {
      let props = this.thumbnail.genProps(fingerprint, query)
      try {
        await fs.lstatAsync(props.path)
        return props.path
      } catch (e) {
        if (e.code !== 'ENOENT') throw e
      }

      let listener = () => {
      }

      this.thumbnail.convert(thumbProps, files[0], listener)

      let thumb = this.thumbnail.requestAsync(fingerprint, query, files)
      if (typeof thumb === 'string') {
        res.status(200).sendFile(thumb)
      } else {
        thumb.on('finish', (err, thumb) => {
          if (err) {

          }
        })
      }
    }
  }
**/

  getThumbnail (user, fingerprint, query, callback) {
    if (!this.userCanReadMedia(user, fingerprint)) throw Object.assign(new Error('permission denied'), { status: 401 })

    let files = this.getFilesByFingerprint(user, fingerprint)
    if (files.length === 0) { return }

    let props = this.thumbnail.genProps(fingerprint, query)
    fs.lstat(props.path, (err, stat) => {
      if (!err) return callback(null, props.path)
      if (err.code !== 'ENOENT') return callback(err)
      callback(null, cb => this.thumbnail.convert(props, files[0], cb))
    })
  }

  /// ////////// task api ///////////////////////////////////////////////////////

  getTasks (user) {
    return this.tasks
      .filter(t => t.user.uuid === user.uuid)
      .map(t => t.view())
  }

  async createTaskAsync (user, props) {
    if (typeof props !== 'object' || props === null) {
      throw Object.assign(new Error('invalid'), { status: 400 })
    }

    let src, dst, task, entries
    if (props.type === 'copy' || props.type === 'move') {
      src = await this.getDriveDirAsync(user, props.src.drive, props.src.dir)
      dst = await this.getDriveDirAsync(user, props.dst.drive, props.dst.dir)
      entries = props.entries.map(uuid => {
        let xstat = src.entries.find(x => x.uuid === uuid)
        if (!xstat) throw new Error('entry not found')
        return xstat
      })

      if (props.type === 'copy') {
        task = new CopyTask(this, user, Object.assign({}, props, { entries }))
      } else {
        task = new MoveTask(this, user, Object.assign({}, props, { entries }))
      }
      this.tasks.push(task)
      return task.view()
    }

    throw new Error('invalid task type')
  }

  /// /////////////////////////
  mkdirp (user, driveUUID, dirUUID, name, callback) {
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      return process.nextTick(() => callback(err))
    }

    let dst = path.join(dir.abspath(), name)
    mkdirp(dst, err => {
      if (err) return callback(err)
      readXstat(dst, (err, xstat) => {
        if (err) return callback(err)
        callback(null, xstat)
      })
    })
  }

  rimraf (user, driveUUID, dirUUID, name, uuid, callback) {
    // TODO permission check
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      return process.nextTick(() => cb(err))
    }

    let dst = path.join(dir.abspath(), name)
    readXstat(dst, (err, xstat) => {
      // ENOENT treated as success
      if (err && err.code === 'ENOENT') return callback(null)
      if (err) return callback(err)
      if (xstat.uuid !== uuid) { return callback(Object.assign(new Error('uuid mismatch'), { status: 403 })) }

      rimraf(dst, err => callback(err))
    })
  }

  createNewFile (user, driveUUID, dirUUID, name, tmp, hash, overwrite, callback) {
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      return process.nextTick(() => cb(err))
    }

    let dst = path.join(dir.abspath(), name)
    if (overwrite) {
      readXstat(dst, (err, xstat) => {
        if (err) return callback(err)
        if (xstat.uuid !== overwrite) {
          let err = new Error('overwrite (uuid) mismatch')
          err.status = 403
          return callback(err)
        }

        forceXstat(tmp, { uuid: xstat.uuid, hash }, (err, xstat) => {
          if (err) return callback(err)
          // dirty
          Object.assign(xstat, { name })
          fs.rename(tmp, dst, err => {
            if (err) return callback(err)
            return callback(null, xstat)
          })
        })
      })
    } else {
      forceXstat(tmp, { hash }, (err, xstat) => {
        if (err) return callback(err)
        // dirty
        Object.assign(xstat, { name })
        fs.link(tmp, dst, err => {
          if (err) {
            callback(err)
          } else {
            callback(null, xstat)
            if (xstat.magic === 'JPEG') {
              if (!this.mediaMap.has(xstat.hash)) {
                Identifier.identify(dst, xstat.hash, xstat.uuid, (err, metadata) => {
                  // TODO
                  if (err) return
                  this.mediaMap.set(xstat.hash, metadata)
                })
              }
            }
          }
        })
      })
    }
  }

  /**
  data { path, size, sha256 }
  **/
  appendFile (user, driveUUID, dirUUID, name, hash, data, callback) {
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      return process.nextTick(() => cb(err))
    }

    let dst = path.join(dir.abspath(), name)
    readXstat(dst, (err, xstat) => {
      if (err) return callback(err)
      if (xstat.type !== 'file') { return callback(Object.assign(new Error('not a file'), { code: 'EISDIR' })) }
      if (xstat.hash !== hash) { return callback(new Error(`append (target) hash mismatch, actual: ${xstat.hash}`)) }
      if (xstat.size % (1024 * 1024 * 1024) !== 0) { return callback(new Error('target size must be multiple of 1G')) }

      let tmp = path.join(this.getTmpDir(), UUID.v4())
      btrfsConcat(tmp, [dst, data.path], err => {
        if (err) return callback(err)

        fs.lstat(dst, (err, stat) => {
          if (err) return callback(err)
          if (stat.mtime.getTime() !== xstat.mtime) {
            let err = new Error('race detected')
            err.code = 'ERACE'
            return callback(err)
          }

          let fingerprint = xstat.size === 0
            ? data.sha256
            : combineHash(xstat.hash, data.sha256)

          forceXstat(tmp, { uuid: xstat.uuid, hash: fingerprint }, (err, xstat2) => {
            if (err) return callback(err)
            // dirty
            xstat2.name = name
            fs.rename(tmp, dst, err => {
              if (err) return callback(err)
              callback(null, xstat2)
            })
          })
        })
      })
    })
  }

  rename (user, driveUUID, dirUUID, fromName, toName, overwrite, callback) {
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      return process.nextTick(() => cb(err))
    }

    let fromPath = path.join(dir.abspath(), fromName)
    let toPath = path.join(dir.abspath(), toName)
    let tmpPath = path.join(this.getTmpDir(), UUID.v4())

    if (overwrite) {
      // if overwrite is provided, the uuid must be reserved
      readXstat(fromPath, (err, srcXstat) => {
        if (err) return callback(err)
        if (srcXstat.type !== 'file') {
          let e = new Error(`${fromName} is not a file`)
          return callback(e)
        }

        readXstat(toPath, (err, dstXstat) => {
          if (err) return callback(err)
          if (dstXstat.type !== 'file') {
            let e = new Error(`${toName} is not a file`)
            return callback(e)
          }

          if (dstXstat.uuid !== overwrite) {
            let e = new Error(`overwrite uuid mismatch, actual: ${dstXstat.uuid}`)
            return callback(e)
          }

          // 1. clone fromPath to tmpPath
          // 2. check xstat
          // 3. stamp tmpPath
          // 4. rename
          // 5. remove src
          btrfsClone(tmpPath, fromPath, err => {
            if (err) return callback(err)
            readXstat(fromPath, (err, xstat) => {
              if (err) {
                rimraf(tmpPath, () => {})
                return callback(err)
              }

              forceXstat(tmpPath, { uuid: dstXstat.uuid, hash: srcXstat.hash }, err => {
                if (err) {
                  rimraf(tmpPath, () => {})
                  return callback(err)
                }

                fs.rename(tmpPath, toPath, err => {
                  rimraf(tmpPath, () => {})
                  if (err) return callback(err)
                  rimraf(fromPath, err => {
                    if (err) return callback(err)
                    readXstat(toPath, callback)
                  })
                })
              })
            })
          })
        })
      })
    } else {
      // we cannot use fs.link because it may leave two files with the SAME uuid.
      fs.lstat(toPath, (err, stat) => {
        if (err) {
          if (err.code !== 'ENOENT') return callback(err)
          fs.rename(fromPath, toPath, err => err ? callback(err) : readXstat(toPath, callback))
        } else {
          let e = new Error('file or directory exists')
          e.code = 'EEXIST'
          callback(e)
        }
      })
    }
  }

  dup (user, driveUUID, dirUUID, fromName, toName, overwrite, callback) {
    let dir = this.driveList.getDriveDir(driveUUID, dirUUID)
    if (!dir) {
      let err = new Error('drive or dir not found')
      err.status = 404
      return process.nextTick(() => cb(err))
    }

    let fromPath = path.join(dir.abspath(), fromName)
    let toPath = path.join(dir.abspath(), toName)
    let tmpPath = path.join(this.getTmpDir(), UUID.v4())

    readXstat(fromPath, (err, srcXstat) => {
      if (err) return callback(err)
      if (srcXstat.type !== 'file') {
        let e = new Error(`${fromName} is not a file`)
        return callback(e)
      }

      btrfsClone(tmpPath, fromPath, err => {
        if (err) return callback(err)
        readXstat(fromPath, (err, xstat) => {
          if (err) return callback(err)
          if (xstat.uuid !== srcXstat.uuid || xstat.mtime !== srcXstat.mtime) {
            let e = new Error(`race condition detected, try again`)
            return callback(e)
          }

          if (overwrite) {
            readXstat(toPath, (err, dstXstat) => {
              if (err) return callback(err)
              if (dstXstat.type !== 'file') {
                let e = new Error(`${toName} is not a file`)
                return callback(e)
              }

              if (dstXstat.uuid !== overwrite) {
                let e = new Error(`uuid mismatch, actual: ${dstXstat.uuid}`)
                return callback(e)
              }

              let props = { uuid: dstXstat.uuid }
              if (srcXstat.hash) props.hash = srcXstat.hash

              forceXstat(tmpPath, props, err => {
                if (err) return callback(err)
                fs.rename(tmpPath, toPath, err => {
                  rimraf(tmpPath, () => {})
                  if (err) return callback(err)
                  readXstat(toPath, callback)
                })
              })
            })
          } else {
            forceXstat(tmpPath, { hash: srcXstat.hash }, (err, xstat) => {
              if (err) return callback(err)
              fs.link(tmpPath, toPath, err => {
                rimraf(tmpPath, () => {})
                if (err) return callback(err)
                readXstat(toPath, callback)
              })
            })
          }
        })
      })
    })
  }

  // callback returns 
  // ENOTEMPTY, ENOTDIR
  // this function try to move srcDirUUID into dstDirUUID
  // this function may fail if target exists (non-empty)
  mvdir (user, srcDriveUUID, srcDirUUID, name, dstDriveUUID, dstDirUUID, callback) {
    let srcDir = this.driveList.getDriveDir(srcDriveUUID, srcDirUUID)
    if (!srcDir) return callback(new Error('source drive or dir not found'))
    if (srcDir.name !== name) return callback(new Error('source directory name mismatch'))
    if (srcDir.parent === null) return callback(new Error('source directory is root'))

    let dstDir = this.driveList.getDriveDir(dstDriveUUID, dstDirUUID)
    if (!dstDir) return callback(new Error('destination drive or dir not found'))

    let srcPath = srcDir.abspath()
    readXstat(srcPath, (err, xstat) => {
      if (err) return callback(err)
      if (xstat.uuid !== srcDir.uuid) {
        srcDir.parent.read()
        return callback(new Error('inconsistent data between in-memory cache and disk file system'))
      }

      let dstPath = path.join(dstDir.abspath(), name)
      try {
        fs.renameSync(srcPath, dstPath)
      } catch (e) {
        // ENOTEMPTY target is non-empty directory 
        // ENOTDIR target is not a directory
        return callback(e)
      }

      let srcParent = srcDir.parent
      srcDir.detach()
      srcDir.attach(dstDir)
      srcParent.read()
      dstDir.read()
      callback(null)
    })
  }

  mvfile (user, srcDriveUUID, srcDirUUID, fileUUID, name, dstDriveUUID, dstDirUUID, callback) {
    let srcDir = this.driveList.getDriveDir(srcDriveUUID, srcDirUUID)
    if (!srcDir) return callback(new Error('source drive or directory not found'))

    let dstDir = this.driveList.getDriveDir(dstDriveUUID, dstDirUUID)
    if (!dstDir) return callback(new Error('destination drive or directory not found'))

    let srcPath = path.join(srcDir.abspath(), name)
    readXstat(srcPath, (err, xstat) => {
      if (err) return callback(err)
      if (xstat.uuid !== fileUUID) return callback(new Error('uuid mismatch'))

      let dstPath = path.join(dstDir.abspath(), name)
      fs.lstat(dstPath, (err, stat) => {
        if (!err) return callback(new Error('target exists'))
        if (err.code !== 'ENOENT') return callback(err)

        // EISDIR rename file to existing directory
        fs.rename(srcPath, dstPath, err => {
          if (err) return callback(err)
          srcDir.read()
          dstDir.read()
          callback(null)
        })
      })
    })
  }

}

module.exports = Fruitmix

