const EventEmitter = require('events').EventEmitter
const crypto = require('crypto')
const stream = require('stream')
const fs = require('fs')
const path = require('path')

const request = require('superagent')
const uuid = require('uuid')
const debug = require('debug')('station')
const Promise = require('bluebird')

const mkdirp = require('mkdirp')
const mkdirpAsync = Promise.promisify(mkdirp)
const rimraf = require('rimraf')
const rimrafAsync = Promise.promisify(rimraf)
const sanitize = require('sanitize-filename')
const ioctl = require('ioctl')

const requestAsync = require('./request').requestHelperAsync
const broadcast = require('../../common/broadcast')
const boxData = require('../../box/boxData')

const Media = require('../../media/media')
const Thumbnail = require('../../lib/thumbnail')
const getFruit = require('../../fruitmix')

const { isUUID } = require('../../common/assertion')
// const Config = require('./const').CONFIG

const Transform = stream.Transform

let asCallback = (fn) => {
  return (props, callback) => {
    fn(props)
      .then(data => callback(null, data))
      .catch(e => callback(e))
  }
}

class HashTransform extends Transform {
  constructor() {
    super()
    this.hashStream = crypto.createHash('sha256')
    this.length = 0
  }

  _transform(buf, enc, next) {
    this.length += buf.length
    this.hashStream.update(buf, enc)
    this.push(buf)
    next()
  }

  getHash() {
    return this.hashStream.digest('hex')
  }
}

class StoreSingleFile {
  constructor(tmp, token, size, hash, jobId) {
    this.tmp = tmp
    this.size = size
    this.hash = hash
    this.token = token
    this.jobId = jobId
  }

  async runAsync(url) {
    return await this.storeFileAsync(url)
  }

  async storeFileAsync(url)  {
    return Promise.promisify(this.storeFile).bind(this)(url)
  }

  storeFile(url, callback) {
    let transform = new HashTransform()
    //TODO: define url
    let fpath = path.join(this.tmp, uuid.v4())
    let finished = false

    debug('start store')

    let error = (err) => {
      debug(err)
      if (finished) return
      finished = true
      debug('coming error')
      return callback(err)
    }
    let finish = (fpath) => {
      if (finished) return
      debug('store finish')
      finished = true
      //TODO: check size sha256
      callback(null, fpath)
    }

    let abort = () => {
      if (finished) return
      finished = true
      callback(new Error('EABORT'))
    }

    let req = request.get(url).set({ 'Authorization': this.token })
    let ws = fs.createWriteStream(fpath)
    debug('store req created')
    req.on('response', res => {
      debug('response', fpath)
      if(res.status !== 200){
        debug('response error')
        error(res.error)
        ws.close()
      }
    })
    req.on('error', err => error(err))
    req.on('abort', () => error(new Error('EABORT')))
    ws.on('finish', () => finish(fpath))
    ws.on('error', err => error(err))

    req.pipe(transform).pipe(ws)
  }

}

class StoreFiles {
  constructor(tmp, token, sizeArr, hashArr, jobId) {
    this.tmp = tmp
    this.sizeArr = sizeArr
    this.hashArr = hashArr
    this.token = token
    this.jobId = jobId
    this.currentIndex = 0 //当前文件数
    this.currentEndpoint = 0 //当前文件结束位置
    let currentSize = 0
  }

  run() {
    
  }

  storeFiles(callback) {
    //TODO: define url
    let url = ''
    let totalSize = 0
    this.sizeArr.forEach(s => totalSize += s)
    this.currentEndpoint = this.sizeArr[0] - 1 // 当前文件结束点
    let finished = false
    let fpathArr = []
    let hashMaker = new HashTransform()
    let fpath = path.join(this.tmp, uuid.v4())
    let ws = fs.createWriteStream(fpath)
    hashMaker.pipe(ws) // pipe

    let error = (err) => {
      console.log(err)
      if (finished) return
      finished = true
      return callback(err)
    }
    let finish = (fpaths) => {
      if (finished) return
      finished = true
      //TODO: check size sha256
      callback(null, fpaths)
    }

    let abort = () => {
      if (finished) return
      finished = true
      callback(new Error('EABORT'))
    }

    let req = request.get(url).set({ 'Authorization': this.token })
    req.on('error', error)
    req.on('abort', () => error(new Error('EABORT')))
    ws.on('finish', () => finish(fpathArr))
    ws.on('error', error())
    req.on('response', res => {
      console.log('response')
      if(res.status !== 200){ 
        ws.close()
        res.destroy()
        return error(res.error)        
      }
      else if(res.get('Content-Length') !== totalSize){ // totalsize error
        ws.close()
        res.destroy()
        return error(new Error('totalsize mismatch'))
      }
      else{ // run 
        res.on('data', data => {
          let chunk = Buffer.from(data)
          if((chunk + this.currentSize - 1) >= this.currentEndpoint){
            res.pause()
            let needL = chunk.length - (this.currentEndpoint - this.currentSize + 1)
            
            // write last chunk
            hashMaker.write(chunk.slice(0, needL))
            let digest = hashMaker.digest('hex')
            ws.close() // close write stream 
            
            // check hash
            if(digest !== this.currentEndpointhashArr[this.currentIndex])
              return error(`${ this.currentIndex } hash mismatch`)
            
            // save fpath
            fpathArr.push(fpath)
            if(fpathArr.length === this.sizeArr.length) 
              return finish(fpathArr)

            //  create new instance
            fpath = path.join(this.tmp, uuid.v4())
            
            this.currentIndex ++
            this.currentEndpoint += this.sizeArr[this.currentIndex]

            hashMaker = new HashTransform()
            ws = fs.createWriteStream(fpath)
            hashMaker.pipe(ws)
            hashMaker.write(chunk.slice(needL, chunk.length))
            this.currentSize += chunk.length

            //resume
            res.resume()
              
            //TODO: do something
            // 1 write chunk
            // 2 check file
            // 3 new HashMaker new Writeable new endpoint new fpath new index
            // 4 resume res
            // 5 end
            
          }else{
            hashMaker.write(data) // update
            this.currentSize += chunk.length
          }
        })

        res.on('end', () => {

        })

        res.on('error', err => {

        })
      }
    })
    
    req.end()    
  }

}


/* data:  {
    type: 'pipe',   // socket communication multiplexing
    
    sessionId:      // client-cloud-station pipe session id (uuid)
    user: {         // valid user data format
      userId: 'xxx',
      nickName: 'xxx',
      avator: 'xxx', 
    },
    method: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
    resource: 'path string', // req.params must base64 encode
    body: {         // req.body, req.query
    
    },
  
    serverAddr:     // valid ip address, whitelist
  }*/
class Pipe {
  constructor(tmp, connect) {
    this.tmp = undefined
    this.connect = connect
    this.connect.register('pipe', this.handle.bind(this))
    this.handlers = new Map()
  }

  handle(data) {
    // decode data.resource 
    let resource = new Buffer(data.resource, 'base64')
    let method = data.method

    let messageType = this.decodeType(resource, method)

    if(!messageType) return debug('can not find equal messageType')
    
    if(this.handlers.has(messageType))
      this.handlers.get(messageType)(data)
    else
      debug('NOT FOUND EVENT HANDLER', messageType, data)
  }

  decodeType(data) {
    let resource = data.resource
    let method = data.method
    let paths = resource.split('/').filter(p => p.length)
    data.paths = [...paths]

    if(!paths.length) return undefined
    let r1 = paths.shift()
    switch(r1) {
      case 'drives':
        return  paths.length === 0 ? (method === 'GET' ? 'GetDrives' : (method === 'POST' ? 'CreateDrive' : undefined))
                  : paths.length === 1 ? (method === 'GET' ? 'GetDrive' : (method === 'PATCH' ? 'UpdateDrive' : (method === 'DELETE' ? 'DeleteDrive' : undefined)))
                    : paths.length === 2 && method === 'GET' ? 'GetDirectories'
                      : paths.length === 3 && method === 'GET' ? 'GetDirectory'
                        : paths.length === 4 && method === 'POST' ? 'WriteDir'
                          : paths.length === 5 && method === 'GET' ? 'DownloadFile' : undefined
        break
      case 'media':
        return paths.length === 0 && method === 'GET' ? 'GetMetadatas'
                  : paths.length === 1 && method === 'GET' ? 'GetMetadata'
                  : undefined
        break
      case  'boxes':
        break
      default:
        break
    }
  }

  /**
   * Drives Api
   */
  // fetch
  async getDrivesAsync(data) {
    let { serverAddr, sessionId, user } = data
    let fruit = getFruit()
    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    let drives = fruit.getDrives(user)
    return await this.successResponseAsync(serverAddr, sessionId, drives)
  }

  // store
  async createDriveAsync(data) {
    let { serverAddr, sessionId, user, body} = data

    let fruit = getFruit()
    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    let drives = fruit.createPublicDriveAsync(user, body)
    return await this.successResponseAsync(serverAddr, sessionId, drives)
  }
  
  //fetch
  async getDriveAsync(data) {
    let { serverAddr, sessionId, user, paths } = data
    let fruit = getFruit()

    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    if(paths.length !== 2 || !isUUID(paths[1])) return await this.errorResponseAsync(serverAddr, sessionId, new Error('resource error'))
    let driveUUID = paths[1]

    let drive = fruit.getDrive(user, driveUUID)
    return await this.successResponseAsync(serverAddr, sessionId, drive)
  }

  
  async updateDriveAsync(data) {
    let { serverAddr, sessionId, user, body, paths } = data
    let fruit = getFruit()

    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    if(paths.length !== 2 || !isUUID(paths[1])) return await this.errorResponseAsync(serverAddr, sessionId, new Error('resource error'))
    let driveUUID = paths[1]
    
    let drive = await fruit.updatePublicDriveAsync(user, driveUUID, body)
    return await this.successResponseAsync(serverAddr, sessionId, drive)
  }

  async deleteDriveAsync(data) {
    // not implemented yet
  }

  //fetch
  async getDirectoriesAsync(data) {
    let { serverAddr, sessionId, user, paths } = data
    let fruit = getFruit()

    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))

    if(paths.length !== 3 || paths[2] !== 'dirs' || !isUUID(paths[1])) return await this.errorResponseAsync(serverAddr, sessionId, new Error('resource error'))
    
    let driveUUID = paths[1]
    let dirs = fruit.getDriveDirs(user, driveUUID)

    return await this.successResponseAsync(serverAddr, sessionId, dirs)
  }

  async getDirectoryAsync(data) {
    let { serverAddr, sessionId, user, body, paths } = data
    let fruit = getFruit()

    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    if(paths.length !== 4 || paths[2] !== 'dirs' || !isUUID(paths[1] || !isUUID(paths[3]))) return await this.errorResponseAsync(serverAddr, sessionId, new Error('resource error'))
    
    let driveUUID = paths[1]
    let dirUUID = path[3]
    let metadata = body.metadata === 'true' ? true : false
    let dirs = await fruit.getDriveDirAsync(user, driveUUID, dirUUID, metadata)
    return await this.successResponseAsync(serverAddr, sessionId, dirs)
  }

  /**
   * 
   * @param {object} data 
   * 
   * {
   *  version: 1,
   *  name: fromPath|toPath, or 'name'
   *  op: enum STRING ['mkdir', 'rename', 'dup', 'remove', 'newfile']
   *  overwrite: optional(UUID)
   *  size: 0 <= size <= 1G, INTEGER
   *  sha256:  (neglected when size === 0),
   * }
   */
  async writeDirAsync(data) {
    let { serverAddr, sessionId, user, body, paths } = data
    let fruit = getFruit()
    
    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    if(paths.length !== 5 || paths[2] !== 'dirs' || !isUUID(paths[1] || !isUUID(paths[3] || paths[4] !== 'entries'))) 
      return await this.errorResponseAsync(serverAddr, sessionId, new Error('resource error'))
    
    let driveUUID = paths[1]
    let dirUUID = path[3]
    let ops = ['mkdir', 'rename', 'dup', 'remove', 'newfile']
    if(ops.findIndex(body.op) === -1)
      return await this.errorResponseAsync(serverAddr, sessionId, new Error('op error'))

    let da = Object.assign({}, body)
    da.driveUUID = driveUUID
    da.dirUUID = dirUUID

    let split = da.name.split('|')
    if (split.length === 0 || split.length > 2)
       throw new Error('invalid name')
    if (!split.every(name => name === sanitize(name)))
       throw new Error('invalid name')
    da.fromName = split.shift()
    da.toName = split.shift() || da.fromName

    switch (da.op) {
      case 'mkdir':
        break
      case 'rename':
        break
      case 'dup':
        break
      case 'remove':
        break
      case 'newfile':
        break
      default:
        break
    }

  }

  /********************************************************************************************/
  
  /**
   * {
   *  version: 1,
   *  name: fromName|toName, or 'name'
   *  op: enum STRING ['mkdir', 'rename', 'dup', 'remove', 'newfile']
   *  overwrite: optional(UUID)
   *  size: 0 <= size <= 1G, INTEGER
   *  sha256:  (neglected when size === 0),
   *  dirUUID,
   *  driveUUID,
   *  fromName,
   *  toName
   * }
   */

  async mkdirAsync(data) {

  }

  async renameAsync(data) {

  }

  async dupAsync(data) {

  }

  async removeAsync(data) {

  }

  async newFileAsync(data) {

  }

  /*******************************************************************************************/
  //fetch
  async downloadFileAsync(data) {
    let { serverAddr, sessionId, user, body, paths } = data
    let fruit = getFruit()
    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))
    if(paths.length !== 6 || paths[2] !== 'dirs' || paths[4] !== 'entries' || !isUUID(paths[1]) || !isUUID(paths[3]) || !isUUID(paths[5])) return await this.errorResponseAsync(serverAddr, sessionId, new Error('resource error'))
    let driveUUID = paths[1]
    let dirUUID = paths[3]
    let entryUUID = paths[5]
    let name = body.name
    
    let dirPath = fruit.getDriveDirPath(user, driveUUID, dirUUID)
    let filePath = path.join(dirPath, name)
    return await fetchFileResponseAsync(filePath, serverAddr, sessionId)
  }

  /****
   * Media Api
   */
  async getMetadatasAsync(data) {
    let { serverAddr, sessionId, user, body } = data
    let fruit = getFruit()
    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))

    const fingerprints = fruit.getFingerprints(user)
    const metadata = fingerprints.reduce((acc, fingerprint) => {
      let meta = Media.get(fingerprint)
      if (meta) acc.push(Object.assign({ hash: fingerprint }, meta))
      return acc
    }, [])
    return await this.successResponseAsync(serverAddr, sessionId, metadata)
  }

  //fetch
  async getMetadataAsync(data) {
    let { serverAddr, sessionId, user, body, paths } = data
    let fruit = getFruit()
    if(!fruit) return await this.errorResponseAsync(serverAddr, sessionId, new Error('fruitmix not start'))

    const fingerprint = paths[1]

    if (body.alt === undefined || body.alt === 'metadata') {
      let metadata = Media.get(fingerprint)
      if (metadata) {
        return await this.successResponseAsync(serverAddr, sessionId, metadata)
      } else {
        return await this.errorResponseAsync(serverAddr, sessionId, new Error('metadata not found'))
      }
    }
    else if (body.alt === 'data') {
      let files = fruit.getFilesByFingerprint(user, fingerprint)
      if (files.length) {
        return await fetchFileResponseAsync(files[0], serverAddr, sessionId)
      } else {
        return await this.errorResponseAsync(serverAddr, sessionId, new Error('media not found'))
      }
    }
    else if (body.alt === 'thumbnail') {

    }
    
  }
  
  getMediaThumbnail(fingerprint, query, files, callback) {

  }
  
  /*********************************
   * 
   */

  fetchFileResponse(fpath, cloudAddr, sessionId, callback) {
    let finished = false
    let url = cloudAddr+ 'v1/stations/' + this.connect.saId + '/response/' + sessionId
    let rs = fs.createReadStream(fpath)
    let req = request.post(url).set({ 'Authorization': this.connect.token })
    req.on('response', res => {
      debug('response', fpath)
      if(res.status !== 200){
        debug('response error')
        callback(res.error)
        rs.close()
      }
    })
    req.on('error', err => {
      if(finished) return
      finished = true
      error(err)
    })
    rs.on('end', () =>{ 
      if(finished) return
      finished = true
      callback(null)
    })
    req.pipe(rs)
  }

  async fetchFileResponseAsync(fpath, cloudAddr, sessionId) {
    return Promise.promisify(this.fetchFileResponse).bind(this)(fpath, cloudAddr, sessionId)
  }
  
  // async test(data) {
  //   debug(data)
  //   let url = Config.CLOUD_PATH + 'v1/stations/' + this.connect.saId + '/response/' + data.jobId 
  //   let store = new StoreSingleFile(this.tmp, this.connect.token, 10000, 'xxxx', data.jobId)
  //   let fpath = await store.runAsync(url)
  //   await this.successResponseAsync(1, data.jobId, { type: 'finish', message: 'just test'})
  // }

  async createTextTweetAsync({ boxUUID, guid, comment }) {
    let box = boxData.getBox(boxUUID)
    let props = { comment, global: guid }
    let result = await box.createTweetAsync(props)
    let newDoc = await boxData.updateBoxAsync({ mtime: result.mtime }, box.doc.uuid)
  }

  async errorResponseAsync(cloudAddr, sessionId, error) {
    let url = cloudAddr + 'v1/stations/' + this.connect.saId + '/response/' + sessionId 
    let params = { code: error.code, message: error.message }
    await requestAsync('POST', url, { params }, {})
  }

  async successResponseAsync(cloudAddr, sessionId, data) {
    let url = cloudAddr + 'v1/stations/' + this.connect.saId + '/pipe/' + sessionId +'/response'
    let params = data
    await requestAsync('POST', url, { params }, {})
  }

  async createBlobTweetAsync({ boxUUID, guid, comment, type, size, sha256, jobId }) {
    // { comment, type: 'blob', id: sha256, global, path: file.path}
    //get blob
    let storeFile = new StoreSingleFile(this.tmp, this.token, size, sha256, jobId)
  }

  register() {
    //drives
    this.handlers.set('GetDrives', asCallback(this.getDrivesAsync).bind(this))
    this.handlers.set('CreateDrive', asCallback(this.createDriveAsync).bind(this))
    this.handlers.set('GetDrive', asCallback(this.getDriveAsync).bind(this))
    this.handlers.set('UpdateDrive',asCallback(this.updateDriveAsync).bind(this))
    this.handlers.set('DeleteDrive',asCallback(this.deleteDriveAsync).bind(this))
    this.handlers.set('GetDirectories',asCallback(this.getDirectoriesAsync).bind(this))
    this.handlers.set('GetDirectory',asCallback(this.getDirectoryAsync).bind(this))
    this.handlers.set('WriteDir',asCallback(this.writeDirAsync).bind(this))
    this.handlers.set('DownloadFile',asCallback(this.downloadFileAsync).bind(this))
  }
}

module.exports = Pipe