import path from 'path'
import fs from 'fs'

import Promise from 'bluebird'
import rimraf from 'rimraf'

import { readXstat, copyXattr, updateXattrHashMagic, updateXattrPermission} from './xstat'
import { IndexedTree } from './indexedTree'
import { mapXstatToObject } from './util'
import { visit } from './visitors'

const ERROR = (code, _text) => (text => Object.assign(new Error(text || _text), { code }))

const EFAIL = ERROR('EFAIL', 'operation failed') 
const EINVAL = ERROR('EINVAL', 'invalid argument')
const EINTR = ERROR('EINTR', 'operation interrupted')
const ENOENT = ERROR('ENOENT', 'entry not found')
const EMISMATCH = ERROR('EMISMATCH', 'uuid mismatch')

export class Forest extends IndexedTree {

  constructor() {
    const proto = {}
    super(proto)

    this.collations = new Map()
  }

  createRoot(props) {

    let root = this.createNode(null, props)
    if (root) this.requestProbe(root)
    return root
  }

  // rename to probe TODO
  probe(node) {

    let finished = false
    let uuid = node.uuid

    let target = node.namepath()
    let mtime = node.mtime
    let mtime1, mtime2, children = []

    fs.stat(target, (err, stats) => {

      if (finished) return
      if (err) return finish(err) 
      if (stats.mtime.getTime() === mtime) return finish(null)

      mtime1 = stats.mtime.getTime()
      fs.readdir(target, (err, entries) => {

        if (finished) return
        if (err) return finish(err)  
        if (entries.length === 0) {
          readXstatAgain()
        }
        else {
          let count = entries.length
          entries.forEach(entry => {
            readXstat(path.join(target, entry), (err, xstat) => {
              if (finished) return
              if (!err) children.push(xstat) // bypass error
              if (!--count) readXstatAgain()
            })
          })
        }
      })

      function readXstatAgain() {

        fs.stat(target, (err, stat2) => {
          if (finished) return
          if (err) return finish(err)
          mtime2 = stat2.mtime.getTime() 
          finish(null)
        })
      }
    }) // end of readXstat

    const finish = (err) => {  

      // target path or name change is irrelevant
      // if node is deleted, blame where it is deleted failing to remove this job
      // so timestamp check should be enough
      if (err) {
        this.requestProbe(node.parent)
        finishJob(false)
      } 
      else if (mtime1 === mtime) {
        finishJob(false)
      }
      else if (mtime1 !== mtime2) {
        finishJob(true)
      }
      else {
        // compare children, create a map first
        let map = new Map()
        children.forEach(xstat => map.set(xstat.uuid, xstat))

        // first round, remove all children not found in xstats
        node.getChildren()
          .filter(child => !map.has(child.uuid))
          .forEach(child => this.deleteSubTree(child))

        // second round, update existing thing if necessary
        node.getChildren().forEach(child => {
          
          let xstat = map.get(child.uuid)
          this.updateNode(child, mapXstatToObject(xstat))
          if (xstat.isDirectory() && xstat.mtime.getTime() !== child.mtime)
            this.requestProbe(child) // TODO

          map.delete(child.uuid)
        })

        // third round, add new node
        Array.from(map.values()).forEach(xstat => {
          let child = this.createNode(node, mapXstatToObject(xstat)) 
          if (xstat.isDirectory())
            this.requestProbe(child) // TODO
        })

        node.mtime = mtime2
        finishJob(false)
      }
    }

    const finishJob = (again) => {

      let job = this.collations.get(node)
      if (again || job.again) {
        job.again = false
        job.abort = probe(node)
      }
      else {
        this.collations.delete(node)
        if (this.collations.size === 0) {
          process.nextTick(() => this.emit('probeStopped'))
        }
      }
    }

    function abort() {
      finished = true    
    }
  }

  // a job is key value pair
  // key:   uuid
  // value: { abort, again }

  // callback is optional TODO
  requestProbe(node, callback) {

    // console.log(`requestProbe ${node.uuid} ${node.name}`)

    // find job with the same uuid (aka, collating the same node)
    let job = this.collations.get(node)

    // creat a job if not found
    if (!job) {
      this.collations.set(node, {
        abort: this.probe(node),
        again: false
      })

      if (this.collations.size === 1) {
        process.nextTick(() => this.emit('probeStarted'))
      }
    }
    else if (!job.again) {
      job.again = true 
    }
    
    return this
  }

  reportNodeMissing(node) {
  }

  reportNodeMismatch(node) {
  }

  reportNodeHashOutdated(node) {
  }

  // v createFolder   targetNode (parent), new name
  // v createFile     targetNode (parent), new name, file, optional digest?
  //   renameFolder   targetNode, new name (not conflicting) 
  //   renameFile     targetNode, new name (not conflicting)
  //   deleteFolder   targetNode, 
  //   deleteFile     targetNode,
  // v listFolder     get node is enough, no operation
  // v readFile       get a path is enough, no operation
  // v overwriteFile  overwrite but preserve uuid
  //   chmod

  listFolder(userUUID, folderUUID) {

    let node = this.findNodeByUUID(folderUUID)
    if (!node) {
      let e = new Error(`listFolder: ${folderUUID} not found`)
      e.code = 'ENOENT'
      return e
    }

    if (!node.isDirectory()) {
      let e = new Error(`listFolder: ${folderUUID} is not a folder`)
      e.code = 'ENOTDIR'
      return e
    }

    if (!node.userReadable(userUUID)) {
      let e = new Error(`listFolder: ${folderUUID} not accessible for given user ${userUUID}`)
      e.code = 'EACCESS'
      return e
    }

    return node
      .getChildren()
      .map(n => {
        if (n.isDirectory()) {
          return {
            uuid: n.uuid,
            type: 'folder',
            owner: n.owner, 
            writelist: n.writelist,
            readlist: n.readlist,
            name: n.name
          }
        }
        else if (n.isFile()) {
          return {
            uuid: n.uuid,
            type: 'file',
            owner: n.owner,
            writelist: n.writelist,
            readlist: n.readlist,
            name: n.name,
            mtime: n.mtime,
            size: n.size
          }
        }
        else
          return null
      })
      .filter(n => !!n)
  }

  readFile(userUUID, fileUUID) {

    let node = this.findNodeByUUID(fileUUID)
    if (!node) {
      return 'ENOENT'
    }

    if (!node.isFile()) {
      return 'EINVAL'
    }

    if (!node.userReadable(userUUID)) {
      return 'EACCESS'
    }

    return node.namepath()
  }

  // create a folder in targetNode with given name
  createFolder(userUUID, targetNode, name, callback) {

    // if not directory, EINVAL
    if (!targetNode.isDirectory()) {
      let error = new Error('createFolder: target should be a folder')
      error.code = 'EINVAL' 
      return process.nextTick(callback, error)
    }

    // if not writable, EACCESS
    if (!targetNode.userWritable(userUUID)) {
      let error = new Error('createFolder: operation not permitted')
      error.code = 'EACCESS'
      return process.nextTick(callback, error)
    }

    // if already exists, EEXIST
    if (targetNode.getChildren().find(c => c.name === name)) {
      let error = new Error('createFolder: file or folder already exists')
      error.code = 'EEXIST'
      return process.nextTick(callback, error)
    }

    let targetpath = path.join(targetNode.namepath(), name)
    fs.mkdir(targetpath, err => {
      if (err) return callback(err)
      readXstat(targetpath, { owner: [userUUID] }, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        let node = this.createNode(targetNode, obj)
        callback(null, node)
      })
    })
  }

  createFile(userUUID, srcpath, targetNode, filename, callback) {
    
    if (!targetNode.isDirectory()) {
      let error = new Error('createFile: target must be a folder')
      error.code = 'EINVAL'
      return process.nextTick(callback, error)
    }

    if (!targetNode.userWritable(userUUID)) {
      let error = new Error('createFile: operation not permitted')
      error.code = 'EACCESS'
      return process.nextTick(callback, error)
    } 

    if (targetNode.getChildren().find(c => c.name === filename)) {
      let error = new Error('createFile: file or folder already exists')
      error.code = 'EEXIST'
      return process.nextTick(callback, error)
    }

    let targetpath = path.join(targetNode.namepath(), filename)
    fs.rename(srcpath, targetpath, err => {
      if (err) return callback(err)
      readXstat(targetpath, { owner: [userUUID] }, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        let node = this.createNode(targetNode, obj)
        callback(null, node)
      })
    }) 
  }

  overwriteFile(userUUID, srcpath, targetNode, callback) {
     
    if (!targetNode.isFile()) {
      let error = new Error('overwriteFile: target must be a file')
      error.code = 'EINVAL'
      return process.nextTick(callback, error)
    }

    if (!targetNode.userWritable(userUUID)) {
      let error = new Error('overwriteFile: operation not permitted')
      error.code = 'EPERM'
      return process.nextTick(callback, error)
    }

    let targetpath = targetNode.namepath()
    copyXattr(srcpath, targetpath, err => {
      if (err) return callback(err)
      fs.rename(srcpath, targetpath, err => {
        if (err) return callback(err)
        readXstat(targetpath, (err, xstat) => {
          if (err) return callback(err)
          let obj = mapXstatToObject(xstat)
          this.updateNode(targetNode, obj) // TODO
          callback(null, targetNode) 
        })
      })
    })
  }

  // this function is used to check if it is allowed and viable to do importFile
  // return true or false
  importFileCheck(userUUID, targetNode, filename) {
    
    return true
  }

  // this function may OVERWRITE existing file
  importFile(userUUID, srcpath, targetNode, filename, callback) {

    let targetpath = path.join(this.abspath(targetNode), filename) 
    let existing = targetNode.getChildren().find(c => c.name === filename)
    if (existing) {
      // !!! reverse order
      return copyXattr(srcpath, targetpath, err => {
        if (err) return callback(err)
        fs.rename(srcpath, targetpath, err => {
          if (err) return callback(err)
          readXstat(targetpath, (err, xstat) => {
            if (err) return callback(err)
            let obj = mapXstatToObject(xstat)
            let tree = existing.tree
            tree.updateNode(existing, obj)
            callback(null, existing)
          })
        })
      })
    }

    fs.rename(srcpath, targetpath, err => {
      if (err) return callback(err)
      readXstat(targetpath, { owner: [userUUID] }, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        let node = targetNode.tree.createNode(targetNode, obj)
        callback(null, node) 
      })
    })
  }

  // rename TODO FIXME
  rename(userUUID, folder, node, newName, callback) {
    let newPath = path.join(folder.namepath(), newName) 
    fs.rename(node.namepath(), newPath, err => {
      if (err) return callback(err)
      readXstat(newPath, (err, xstat) => {
        if (err) return callback(err)
        let obj = mapXstatToObject(xstat)
        this.updateNode(node, obj)
        callback(null, node)
      })
    })
  }

  updatePermission(userUUID, folder, node, obj, callback) {
    
    if (!node.isRootOwner(userUUID)) {
      let error = new Error('permission denied')
      error.code = 'EACCESS' 
      return process.nextTick(callback, error)
    } 

    updateXattrPermission(node.namepath(), node.uuid, obj.writelist, obj.readlist, (err, xstat) => {

      if (err) return callback(err)
      let obj = mapXstatToObject(xstat)
      this.updateNode(node, obj)
      callback(null, node)
    }) 
  }

  deleteFileOrFolder(userUUID, folder, node, callback) {
  
    if (!folder.userWritable(userUUID)) {
      let error = new Error('permission denied')
      error.code = 'EACCESS'
      return process.nextTick(callback, error)
    }

    rimraf(node.namepath(), err => {
      if (err) return callback(err)
      this.deleteSubTree(node)
      callback(null)
    })
  }

  print(uuid) {

    if (!uuid) uuid = this.root.uuid
    let node = this.uuidMap.get(uuid)
    if (!node) {
      console.log(`no node found to have uuid: ${uuid}`)
      return
    }

    let queue = []
    node.preVisit(n => {
      let obj = {
        parent: n.parent === null ? null : n.parent.uuid,
        uuid: n.uuid,
        type: n.type,
        owner: n.owner,
        writelist: n.writelist,
        readlist: n.readlist,
        name: n.name
      }
      queue.push(obj)
    })

    return queue
  }

  updateHashMagic(target, uuid, hash, magic, timestamp, callback) {

    // update file first
    // besides system error, this function may returns
    // EINVAL, EMISMATCH, EOUTDATED
    updateXattrHashMagic(target, uuid, hash, magic, timestamp, (err, xstat) => {
      if (err) return callback(err)
      let node = this.findNodeByUUID(uuid) 
      if (!node) {
        // this is a weird case but possible, say right after
        // updateXattrHashMagic's last operation finished the node is deleted
        // but we have nothing to do, so pretend everything is fine
        // need more consideration and should test and log it TODO
        return callback(null)
      }
      this.updateNode(node, mapXstatToObject(xstat))
      callback(null) 
    })
  }

  updateFileNode(xstat) {

    if (!xstat.isFile()) return
    
    let node = this.findNodeByUUID(xstat.uuid)
    if (!node) return
    if (!node.isFile()) return

    this.updateNode(node, mapXstatToObject(xstat))
  }

  //////////////////////////////////////////////////////////////////////////////
  //
  // for share api
  //

  getSharedWithMe(userUUID) {

    let arr = []

    this.shared.forEach(node => {

      if (node.root().owner.find(uuid => uuid === userUUID)) return
      if (node.writelist.find(uuid => uuid === userUUID) || 
          node.readlist.find(uuid => uuid === userUUID)) {

        let props = Object.assign({}, node, {
          name: undefined,
          parent: undefined,
          children: undefined,
        })

        props.root = node.root().uuid
        
        arr.push(props)
      }
    })

    return arr
  }

  getSharedWithOthers(userUUID) {

    let arr = []
    
    this.shared.forEach(node => {

      if (node.root().owner.find(uuid => uuid === userUUID)) {

        let props = Object.assign({}, node, {
          name: undefined,
          parent: undefined,
          children: undefined
        })

        props.root = node.root().uuid 

        arr.push(props)
      }
    }) 
    
    return arr
  }

  //////////////////////////////////////////////////////////////////////////////

  mediaUserReadable(digest, userUUID) {

    let digestObj = this.hashMap.get(digest)
    if (!digestObj) return false

    let node = digestObj.nodes.find(n => n.userReadable(userUUID))
    return !!node
  }

 
  // this is a two step calculation, this is the first one:
  initMediaMap(userUUID) {

    //  map: digest => obj
    //  obj: {
    //    digest,
    //    type,
    //    meta,
    //    share, not defined here
    //  }

    let map = new Map()
    this.hashMap.forEach((digestObj, digest) => {

      // find at least one that user readable
      if (digestObj.nodes.find(node => node.userReadable(userUUID))) {
        let obj = { digest, type: digestObj.type }
        if (digestObj.meta) Object.assign(obj, digestObj.meta)
        obj.sharing = 1
        map.set(digest, obj)
      }
    })

    return map
  }

  readMedia(userUUID, digest) {

    let digestObj = this.hashMap.get(digest)
    if (!digestObj) return

    for (let i = 0; i < digestObj.nodes.length; i++) {
      let node = digestObj.nodes[i]
      if (node.userReadable(userUUID))
        return node.namepath()
    }
  }

  readMediaPath(digest) {

    let digestObj = this.hashMap.get(digest)
    if (!digestObj) return

    for (let i = 0; i < digestObj.nodes.length; i++) {
      let node = digestObj.nodes[i]
      return node.namepath()
    }
  }

  //////////////////////////////////////////////////////////////////////////////


  // for meta api
  getMeta(userUUID) {

    let arr = []
    this.hashMap.forEach((digestObj, digest) => {
      if (digestObj.nodes.find(node => node.userReadable(userUUID)))
        arr.push(Object.assign({}, digestObj.meta, { digest }))
    })

    return arr
  } 

}


export const createFiler = () => new Forest()



