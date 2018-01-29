const { assert, isUUID, isSHA256, validateProps } = require('../common/assertion')
const fs = require('fs')
/// ////////////// box api ///////////////////////
module.exports = {

  getBlobMediaThumbnail(user, fingerprint, query, callback) {

    try {
      this.userCanReadBlob(user, fingerprint)
    } catch (e) {
      return callback(e)
    }

    if (!this.mediaMap.has(fingerprint)) {
      let err = new Error('media not found')
      err.status = 404
      process.nextTick(() => callback(err))
    }

    let fPath = this.getBoxFilepath(user, query.boxUUID, fingerprint)

    let props = this.thumbnail.genProps(fingerprint, query)
    fs.lstat(props.path, (err, stat) => {
      if (!err) return callback(null, props.path)
      if (err.code !== 'ENOENT') return callback(err)
      callback(null, cb => this.thumbnail.convert(props, fPath, cb))
    })
  },

  reportMedia(fingerprint, metadata) {
    this.mediaMap.setMetadata(fingerprint, metadata)
  },

  userCanReadBlob(user, fingerprint) {
    if(!user || !user.global || !user.global.id) return false
    let guid = user.global.id
    let boxes = [...this.boxData.boxes.values()].filter(box => 
      box.doc.owner === guid ||
      box.doc.users.includes(guid))
    if(boxes.find(box => box.files.has(fingerprint))) return true
    return false
  },
  
  userCanReadBox(user, boxUUID) {
    if(!user || !user.global.id) return false
    let guid = user.global.id
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) return false
    return true
  },
  /**
   * get all box descriptions user can access
   * @param {Object} user
   * @return {array} a docList of boxes user can view
   */
  getAllBoxes (user) {
    let guid = user.global.id
    return this.boxData.getAllBoxes(guid)
  },

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
  },

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
  },

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
  },

  getBoxFilepath(user, boxUUID, fingerprint) {
    if(!this.userCanReadBox(user, boxUUID)) throw Object.assign(new Error('permission denied'), { status: 403 })
    let box = this.boxData.getBox(boxUUID)
    let fPath = this.boxData.blobs.retrieve(fingerprint)
    if(!box.files.has(fingerprint) || !fPath) throw Object.assign(new Error('file not found'), { status: 404 })
    return fPath
  },

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
  },

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
    if (box.doc.owner !== guid && !box.doc.users.includes(guid))
      throw Object.assign(new Error('no permission'), { status: 403 })
    
    return await box.retrieveAllBranchesAsync()
  },

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

    return await box.retrieveBranchAsync(branchUUID)
  },

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
  },

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
  },

  async deleteBranchAsync (user, boxUUID, branchUUID) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    if (!isUUID(branchUUID)) throw Object.assign(new Error('invalid branchUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.deleteBranchAsync(branchUUID)
  },

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
    if (!this.userCanReadBox(user, boxUUID))  throw Object.assign(new Error('no permission'), { status: 403 }) 
    let box = this.boxData.getBox(boxUUID)
    if (props.first) assert(Number.isInteger(props.first), 'first should be an integer')
    if (props.last) assert(Number.isInteger(props.last), 'last should be an integer')
    if (props.count) assert(Number.isInteger(props.count), 'count should be an integer')
    if (props.last) assert(typeof props.segments === 'string', 'segments should be a string')
    let metadata = props.metadata
    let tweets = await box.getTweetsAsync(props)
    if (metadata) {
      tweets.forEach(t => 
        t.type === 'list' ? (t.list.forEach(l => this.mediaMap.hasMetadata(l.sha256) ? l.metadata = this.mediaMap.getMetadata(l.sha256) 
        : this.boxData.blobs.medias.has(l.sha256) ? l.metadata = this.boxData.blobs.medias.get(l.sha256): t))
         : t
      )
    }
    return tweets
  },

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
   * @param {array} props.src - {sha256, filepath}, for blob and list
   * @return {Object} tweet object
   */
  async createTweetAsync (user, boxUUID, props) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let global = user.global
    if (box.doc.owner !== global.id && !box.doc.users.includes(global.id)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    props.global = global

    validateProps(props, ['global', 'comment'], ['type', 'id', 'list', 'src', 'parent'])
    assert(typeof props.comment === 'string', 'comment should be a string')
    assert(typeof props.global === 'object', 'global should be an object')
    if (props.type) assert(typeof props.type === 'string', 'type should be a string')
    if (props.id) assert(isSHA256(props.id) || isUUID(props.id), 'id should be sha256 or uuid')
    if (props.list) assert(Array.isArray(props.list), 'list should be an array')
    if (props.src) assert(Array.isArray(props.src), 'src should be an array')
    let result = await box.createTweetAsync(props)
    await this.boxData.updateBoxAsync({mtime: result.mtime}, boxUUID)
    return result.tweet
  },

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
  },

  /**
   * get commit object
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {string} commitHash - sha256 of commit object
   * @return {Object} commit Object
   */
  async getCommitAsync (user, boxUUID, commitHash) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    if (!isSHA256(commitHash)) throw Object.assign(new Error('invalid commitHash'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.getCommitAsync(commitHash)
  },

  async createCommitAsync(user, boxUUID, props) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid))
      throw Object.assign(new Error('no permission'), { status: 403 })
    
    props.committer = guid

    validateProps(props, ['root', 'committer'], ['parent', 'branch', 'toUpload', 'uploaded'])
    assert(isSHA256(props.root), 'root must be a sha256 string')
    if (props.parent) assert(isSHA256(props.parent), 'parent must be a sha256 string')
    if (props.branch) assert(isUUID(props.branch), 'branch must be an uuid')
    if (props.toUpload) 
      assert(Array.isArray(props.toUpload) && props.toUpload.every(isSHA256), 'toUpload should be a sha256 array')
    if (props.uploaded)
      assert(Array.isArray(props.uploaded) && props.uploaded.every(isSHA256), 'uploaded should be a sha256 array')
    if ((props.toUpload && !props.uploaded) || (!props.toUpload && props.uploaded))
      throw Object.assign(new Error('toUpload and uploaded should both exist or non-exist'), { status: 400 })

    let commit = await box.createCommitAsync(props)
    await this.boxData.updateBoxAsync({mtime: new Date().getTime()}, boxUUID)
    return commit
  },

  /**
   * get hash array of contents in root tree object
   * @param {Object} user 
   * @param {string} boxUUID 
   * @param {string} treeHash - sha256 of tree object
   * @return {array} hash array of contents in tree
   */
  async getTreeListAsync (user, boxUUID, treeHash) {
    if (!isUUID(boxUUID)) throw Object.assign(new Error('invalid boxUUID'), { status: 400 })
    if (!isSHA256(treeHash)) throw Object.assign(new Error('invalid treeHash'), { status: 400 })
    let box = this.boxData.getBox(boxUUID)
    if (!box) throw Object.assign(new Error('box not found'), { status: 404 })

    let guid = user.global.id
    if (box.doc.owner !== guid && !box.doc.users.includes(guid)) { throw Object.assign(new Error('no permission'), { status: 403 }) }

    return box.getTreeListAsync(treeHash, true)
  }

}