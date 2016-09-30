import EventEmitter from 'events'

import UUID from 'node-uuid'
import validator from 'validator'
import deepEqual from 'deep-equal'

/**

  a share doc

  {
    doctype: 'mediashare',
    docversion: '1.0'

    uuid: xxxx,

    author: xxxx,
*   maintainers: [], // 0..n 
*   viewers: [], // 0..n

*   album: null or object { title, text }
*   sticky: true or false,
    
    ctime: xxxx,
    mtime: xxxx,

    contents: [
      {
*       digest: xxxx
        creator: xxxx
        ctime: xxxx
      }
    ]
  }

  a share object 
  {
    digest: xxx
    doc: {
      ... // a share doc
    }
  }
**/

const isUUID = (uuid) => (typeof uuid === 'string') ? validator.isUUID(uuid) : false
const isSHA256 = (sha256) => (typeof sha256 === 'string') ? /[a-f0-9]{64}/.test(sha256) : false

// this function generate a mediashare doc
const createMediaShareDoc = (userUUID, obj) => {

  let { maintainers, viewers, album, sticky, contents } = obj

  // FIXME
  maintainers = []

  if (!Array.isArray(viewers)) viewers = []

  // validate, sort, dedup, and must not be the user itself
  viewers = viewers
    .filter(isUUID)
    .filter(viewer => viewer !== userUUID) // remove self ?
    .sort()
    .filter((item, index, array) => !index || item !== array[index - 1])

  // album must be true or false, defaults to false
  if (!album) album = null
  else {

    //  {
    //    title: string
    //    text: string
    //  }

    let obj = {}
    if (typeof album.title === 'string')
      obj.title = album.title
    else 
      obj.title = ''

    if (typeof album.text === 'string')
      obj.text = album.text
    else
      obj.text = ''

    album = obj
  }

  // sticky must be true or false, defaults to false
  if (typeof sticky !== 'boolean') sticky = false

  if (!Array.isArray(contents)) 
    contents = []
  else {

    let time = new Date().getTime()
    contents = contents
      .filter(isSHA256)
      .filter((item, index, array) => index === array.indexOf(item))
      .map(digest => ({
        author: userUUID,
        digest,
        time
      }))
  }

  if (!contents.length) {
    let error = new Error('contents invalid')
    error.code = 'EINVAL'
    return error
  }

  let time = new Date().getTime()

  return {
    doctype: 'mediashare',
    docversion: '1.0',
    uuid: UUID.v4(),
    author: userUUID,
    maintainers,
    viewers,
    album,
    sticky,
    ctime: time,
    mtime: time,
    contents
  }
}

/**
  each op contains:
  {
    op: 'add', 'delete', or 'update', add, delete for array, update for non-array
  }
**/

const sortDedup = (isType) => {
  return (arr) => {
    return [...arr]
      .filter(isType)
      .sort()
      .filter((item, index, arr) => !index || item !== arr[index - 1])
  }
}


const subtractUUIDArray = (a, b) => {
 
  let aa = [...a]
  let dirty = false

  b.forEach(item => {
    let index = aa.indexOf(item)
    if (index !== -1) {
      dirty = true
      aa.splice(index, 1) 
    }
  }) 

  return dirty ? aa : a 
}

const subtractContentArray = (userUUID, a, b) => {

  let aa = [...a]
  let dirty = false

  b.forEach(digest => {
    let index = aa.findIndex(x => x.digest === digest)
    if (index !== -1) {
      dirty = true
      aa.splice(index, 1)
    }
  })

  return dirty ? aa : a 
}

const addUUIDArray = (a, b) => {
  
  let c = sortDedup(isUUID)([...a, ...b])    
  return deepEqual(a, c) ? a : c 
}

const updateMediaShareDoc = (userUUID, doc, ops) => {

  let op
  let { maintainers, viewers, album, sticky, contents } = doc

  if (userUUID === doc.author) {

    op = ops.find(op => op.path === 'maintainers' && op.op === 'delete') 
    if (op && Array.isArray(op.value)) {
      maintainers = subtractUUIDArrray(maintainers, sortDedup(isUUID)(op.value))
    }

    op = ops.find(op => op.path === 'maintainers' && op.op === 'add') 
    if (op && Array.isArray(op.value)) {
      maintainers = addUUIDArray(maintainers, sortDedup(isSHA256)(op.value).filter(x => x !== doc.author))
    }

    op = ops.find(op => op.path === 'viewers' && op.op === 'delete')
    if (op && Array.isArray(op.value)) {
      viewers = subtractUUIDArray(viewers, sortDedup(isUUID)(op.value))
    }

    op = ops.find(op => op.path === 'viewers' && op.op === 'add') 
    if (op && Array.isArray(op.value)) {
      viewers = addUUIDArray(viewers, sortDedup(isUUID)(op.value).filter(x => x !== doc.author))
    }

    op = ops.find(op => op.path === 'album' && op.op === 'replace') 
    if (op && typeof op.value === 'object') {
      let title = typeof op.value.title === 'string' ? op.value.title : ''
      let text = typeof op.value.text === 'string' ? op.value.text : ''   

      if (title !== album.title || text !== album.text) album = { title, text }
    }

    op = ops.find(op => op.path === 'sticky' && op.op === 'replace')
    if (op && typeof op.value === 'boolean' && op.value !== sticky) {
      sticky = op.value
    }
  }

  if (userUUID === doc.author || doc.maintainers.indexOf(userUUID) !== -1) {

    op = ops.find(op => op.path === 'contents' && op.op === 'delete') 
    if (op && Array.isArray(op.value)) {

      let c = [...contents]
      let dirty = false

      sortDedup(isSHA256)(op.value)
        .forEach(digest => {
          let index = c.findIndex(x => 
            x.digest === digest && ( userUUID === doc.author || userUUID === x.creator)) 

          if (index !== -1) {
            c.splice(index, 1)
            dirty = true
          }
        })

      if (dirty) contents = c 
    }

    op = ops.find(op => op.path === 'contents' && op.op === 'add')
    if (op && Array.isArray(op.value)) {

      let c = [...contents]
      let dirty = false

      sortDedup(isSHA256)(op.value)
        .forEach(digest => {
          let index = c.findIndex(x => x.digest === digest)
          if (index !== -1) return

          c.push({
            digest: b,
            creator: userUUID,
            ctime: new Date().getTime() 
          })              
          dirty = true
        })

      if (dirty) contents = c 
    }
  }

  if (maintainers === doc.maintainers &&
      viewers === doc.viewers &&
      album === doc.album &&
      sticky === doc.sticky &&
      contents === doc.contents) {

    return doc
  }

  let update = {
    doctype: doc.doctype,
    docversion: doc.docversion,
    uuid: doc.uuid,
    author: doc.userUUID,
    maintainers,
    viewers,
    album,
    sticky,
    ctime: doc.ctime,
    mtime: new Date().getTime(),
    contents
  }

  // console.log(update)
  return update
}

class Media extends EventEmitter {

  // shareMap stores uuid (key) => share (value)
  // mediaMap stores media/content digest (key) => (containing) share Set (value), each containing share Set contains share
  constructor(shareStore, talkStore) {

    super()

    this.shareStore = shareStore
    this.talkStore = talkStore

    // using an map instead of an array
    this.shareMap = new Map()
    // using an map instead of an array
    this.mediaMap = new Map()
    // each (local) talk has its creator and media digest, as its unique identifier
    this.talks = []
    // each remote talk has its viewer (a local user), creator, and media digest, as its unique identifier
    this.remoteMap = new Map()      // user -> user's remote talks
                                    // each talsk has creator and media digest as its unique identifier
  }

  load() {
    this.shareStore.retrieveAll((err, shares) => {
      shares.forEach(share => {
        this.indexShare(share)
      })
      this.emit('shareStoreLoaded')
    }) 
  }

  // add a share to index maps
  indexShare(share) {
    this.shareMap.set(share.doc.uuid, share)
    share.doc.contents.forEach(item => {
      let shareSet = this.mediaMap.get(item.digest)
      if (shareSet) {
        shareSet.add(share)
      }
      else {
        shareSet = new Set()
        shareSet.add(share)
        this.mediaMap.set(item.digest, shareSet)
      }
    })
  }

  // remove a share out of index maps
  unindexShare(share) {
    this.shareMap.delete(share.doc.uuid)
    share.doc.contents.forEach(item => {
      let shareSet = this.mediaMap.get(item.digest)
      shareSet.delete(share) 
    })
  }

  // create a mediashare object from user provided object
  // FIXME permission check
  createMediaShare(userUUID, obj, callback) {
  try{
    let doc = createMediaShareDoc(userUUID, obj)
    if (doc instanceof Error) {
      return process.nextTick(callback, doc)
    }

    this.shareStore.store(doc, (err, share) => {
      if (err) return callback(err)
      this.indexShare(share)      
      callback(null, share)
    })
  } catch (e) {
    console.log(e)
  }
  }

  // FIXME permission check
  updateMediaShare(userUUID, shareUUID, ops, callback) {
  try {

    let share = this.shareMap.get(shareUUID)
    if (!share) return callback('ENOENT') // FIXME

    if (share.doc.author !== userUUID)
      return callback('EACCESS')

    let doc = updateMediaShareDoc(userUUID, share.doc, ops) 
    if (doc === share.doc) 
      return callback(null, share)

    this.shareStore.store(doc, (err, newShare) => {
      if (err) return callback(err)
      this.unindexShare(share) 
      this.indexShare(newShare)
      callback(null, newShare)
    })
     
  } catch (e) {
    console.log(e)
  }
  }

  // archive a mediashare and unindex
  // FIXME permission check
  deleteMediaShare(userUUID, shareUUID, callback) {

    let share = this.shareMap.get(shareUUID)
    if (!share) return callback('ENOENT')

    this.shareStore.archive(shareUUID, err => {
      if (err) return callback(err)
      this.unindexShare(share)
      this.shareMap.delete(shareUUID) 
      callback(null)
    })
  }

  // my share is the one I myself is the creator
  // locally shared to me is the one that I am the viewer but not creator, the creator is a local user
  // remotely shared to me is the one that I am the viewer but not creator, the creator is a remote user
  getUserShares(userUUID) {

    let shares = []
    this.shareMap.forEach((value, key, map) => {
      let share = value
      if (share.doc.author === userUUID || 
          share.doc.maintainers.find(u => u === userUUID) || 
          share.doc.viewers.find(u => u === userUUID)) 
        shares.push(share) 
    })
    return shares
  }
  
  // retrieves all media talks I can view
  getMediaTalks(userUUID) {

    let localTalks = []
    this.mediaMap.forEach((value, key, map) => {
      let shareSet = value
      // first, the user must be either creator or viewer
      // second, if he is creator, get the whole mediatalk
      // if he is not the creator, get only the part he can view
      // push to queue
    })
    return localTalks + remoteTalks
  }
}

export default (shareStore, talkStore) => {
  let media = new Media(shareStore, talkStore)
  media.load()
  return media
}

