const mkdirp = require('mkdirp')
const path = require('path')
const Promise = require('bluebird')
const fs = require('fs')
const child = require('child_process')
const broadcast = require('../common/broadcast')

class BlobStore {
  constructor() {
    this.initialized = false
    this.repoDir = undefined

    broadcast.on('FruitmixStart', froot => {
      let repoDir = path.join(froot, 'repo')
      this.init(repoDir)
    })

    broadcast.on('FruitmixStop', () => this.deinit())
  }

  init(repoDir) {
    mkdirp(repoDir, err => {
      if (err) {
        console.log(err)
        broadcast.emit('RepoInitDone', err)
        return
      }

      this.repoDir = repoDir
      this.initialized = true

      broadcast.emit('RepoInitDone')
    })
  }

  deinit() {
    this.initialized = false
    this.repoDir = undefined

    process.nextTick(() => broadcast.emit('RepoDeinitDone'))
  }

  // store a list of files
  // src is an array of tmp filepath, file name is the sha256 of itself
  store(src, callback) {
    let srcStr = src.join(' ')
    let dst = this.repoDir

    child.exec(`chmod 444 ${srcStr}`, (err, stdout, stderr) => {
      if (err) return callback(err)
      if (stderr) return callback(stderr)

      child.exec(`mv ${srcStr} -t ${dst}`, (err, stdout, stderr) => {
        if (err) return callback(err)
        if (stderr) return callback(stderr)
        return callback(stdout)
      })
    })
  }
  // store(src, hash, callback) {
  //   if(!this.initialized) throw new Error('BlobStore not init')
  //   let dst = path.join(this.repoDir, hash)
  //   mkdirp(this.repoDir, err => {
  //     if (err) return callback(err)
  //     fs.lstat(dst, (err, stats) => {
  //       if (!err) return callback(null)
  //       if (err.code !== 'ENOENT') return callback(err)
  //       fs.rename(src, dst, err => {
  //         if (err) return callback(err)
  //         child.exec(`chmod 444 ${dst}`, (err, stdout, stderr) => {
  //           if(err) return callback(err)
  //           if(stderr) return callback(stderr)
  //           return callback(null, stdout)
  //         })
  //       })
  //     })
  //   })
  // }

  async storeAsync(src) {
    return Promise.promisify(this.store).bind(this)(src)
  }

  retrieve(hash) {
    return path.join(this.repoDir, hash)
  }
}

module.exports = new BlobStore()

