const Promise = require('bluebird')
const router = require('express').Router()
const uuid = require('uuid')
const jwt = require('jwt-simple')
const formidable = require('formidable')
const path = require('path')
const UUID = require('uuid')
const fs = require('fs')
const rimraf = require('rimraf')
const rimrafAsync = Promise.promisify(rimraf)
const Dicer = require('dicer')
const sanitize = require('sanitize-filename')
const crypto = require('crypto')

const secret = require('../config/passportJwt')
const fingerprintSimpleAsync = Promise.promisify(require('../utils/fingerprintSimple'))
const { isSHA256 } = require('../lib/assertion')
const getFruit = require('../fruitmix')

const EUnavail = Object.assign(new Error('fruitmix unavailable'), { status: 503 })
const fruitless = (req, res, next) => getFruit() ? next() : next(EUnavail)
const SIZE_1G = 1024 * 1024 * 1024

/**
This auth requires client providing:
1. both local user token AND wechat token
2. only wechat token (guest mode)

returns 401 if failed
*/
// user contains local user and wechat guest
const auth = (req, res, next) => {

  let text = req.get('Authorization')
  if (typeof text !== 'string') 
    return res.status(401).end()

  let split = text.split(' ')
  // console.log(split)

  if (split.length < 2 || split.length > 3 || split[0] !== 'JWT')
    return res.status(401).end()

  let cloud = jwt.decode(split[1], secret) 
  if (cloud.deadline < new Date().getTime()) {
    console.log('overdue')
    return res.status(401).end()
  }
  if (split.length === 2) {
    req.user = {
      global: cloud.global
    }
    return next()
  }

  let local = jwt.decode(split[2], secret)
  let user = getFruit().findUserByUUID(local.uuid)
  if (!user || user.global.id !== cloud.global.id)
    return res.status(401).end()
  req.user = user
  next()
}

router.get('/', fruitless, auth, (req, res, next) => {
  try {
    let docList = getFruit().getAllBoxes(req.user)
    res.status(200).json(docList)
  } catch(e) {
    next(e)
  } 
})

router.post('/', fruitless, auth, (req, res, next) => {
  getFruit().createBoxAsync(req.user, req.body)
    .then(doc => res.status(200).json(doc))
    .catch(next)
})

router.get('/:boxUUID', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  try {
    let doc = getFruit().getBox(req.user, boxUUID)
    res.status(200).json(doc)
  } catch(e) {
    next(e)
  }
})

// FIXME: permission: who can patch the box ?
// here only box owner is allowed
router.patch('/:boxUUID', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  getFruit().updateBoxAsync(req.user, boxUUID, req.body)
    .then(newDoc => res.status(200).json(newDoc))
    .catch(next)
})

router.delete('/:boxUUID', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  getFruit().deleteBoxAsync(req.user, boxUUID)
    .then(() => res.status(200).end())
    .catch(next)
})

router.get('/:boxUUID/branches', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  getFruit().getAllBranchesAsync(req.user, boxUUID)
    .then(branches => res.status(200).json(branches))
    .catch(next)
})

router.post('/:boxUUID/branches', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID

  getFruit().createBranchAsync(req.user, boxUUID, req.body)
    .then(branch => res.status(200).json(branch))
    .catch(next)
})

router.get('/:boxUUID/branches/:branchUUID', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let branchUUID = req.params.branchUUID
  
  getFruit().getBranchAsync(req.user, boxUUID, branchUUID)
    .then(branch => res.status(200).json(branch))
    .catch(err => {
      if (err.code === 'ENOENT') res.status(404).end()
      else next(err)
    })
})

router.patch('/:boxUUID/branches/:branchUUID', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let branchUUID = req.params.branchUUID

  getFruit().updateBranchAsync(req.user, boxUUID, branchUUID, req.body)
    .then(updated => res.status(200).json(updated))
    .catch(err => {
      if (err.code === 'ENOENT') res.status(404).end()
      else next(err)
    })
})

// FIXME: who can delete branch ?
router.delete('/:boxUUID/branches/:branchUUID', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let branchUUID = req.params.branchUUID
  
  getFruit().deleteBranchAsync(req.user, boxUUID, branchUUID)
    .then(() => res.status(200).end())
    .catch(next)
})

const parseHeader = header => {
  let name, filename, fromName, toName
  // let x = header['content-disposition'][0].split('; ')
  let x = Buffer.from(header['content-disposition'][0], 'binary').toString('utf8').replace(/%22/g, '"').split('; ')
  //fix %22

  if (x[0] !== 'form-data') throw new Error('not form-data')
  if (!x[1].startsWith('name="') || !x[1].endsWith('"')) throw new Error('invalid name')
  name = x[1].slice(6, -1) 

  // validate name and generate part.fromName and .toName
  let split = name.split('|')
  if (split.length === 0 || split.length > 2) throw new Error('invalid name')
  if (!split.every(name => name === sanitize(name))) throw new Error('invalid name')
  fromName = split.shift()
  toName = split.shift() || fromName

  if (x.length > 2) {
    if (!x[2].startsWith('filename="') || !x[2].endsWith('"')) throw new Error('invalid filename')
    filename = x[2].slice(10, -1)

    // validate part.filename and generate part.opts
    let { size, sha256 } = JSON.parse(filename)
    return { type: 'file', name, fromName, toName, size, sha256 }
  } else {
    return { type: 'field', name }
  } 
}

const errorHandler = (dicer, req) => {
  if(dicer) {
    dicer.removeAllListeners()
    dicer.on('error', () => {})
    req.unpipe(dicer)
    dicer.end()
    dicer = null
  }
}

// validate size and sha256
const validate = (props) => {
  try {
    if (!Number.isInteger(props.size))
      throw new Error('size must be an integer')

    if (!isSHA256(props.sha256))
      throw new Error('invalid sha256')
  } catch(e) {
    e.status = 400
    throw e
  }
}

// obj contains the properties to be checked
const check = (size, sha256, obj) => {
  if (size !== obj.total) {
    let e = new Error('size mismatch')
    e.status = 409
    throw e
  }

  if (sha256 !== obj.fingerprint) {
    let e = new Error('sha256 mismatch')
    e.status = 409
    throw e
  }
}

const dataHandler = (rs, callback) => {
  let tmpdir = getFruit().getTmpDir()
  let tmpPath = path.join(tmpdir, UUID.v4())
  let ws = fs.createWriteStream(tmpPath)
  let hashMaker = crypto.createHash('sha256')
  let hashArr = [], fingerprint
  let lenWritten = 0     // total length is 1G
  let total = 0

  // calculate hash of each segment(1G)
  rs.on('data', data => {
    let chunk = Buffer.from(data)

    if (lenWritten + chunk.length > SIZE_1G) {
      // write data to full, update hash
      let len = SIZE_1G - lenWritten
      hashMaker.update(chunk.slice(0, len))
      hashArr.push(hashMaker.digest())

      // write the rest of data
      lenWritten = chunk.slice(len).length
      hashMaker = crypto.createHash('sha256')
      hashMaker.update(chunk.slice(len))

      // ws.write(chunk)
      if (ws.write(chunk) === false) rs.pause()
      // total += chunk.length
    } else {
      lenWritten += chunk.length
      hashMaker.update(chunk)
      if (ws.write(chunk) === false) rs.pause()
      // ws.write(chunk)
      // total += chunk.length
    }
    total += chunk.length
  })

  rs.on('end', () => {
    ws.end()
    // calculate fingerprint
    hashArr.push(hashMaker.digest())
    if (hashArr.length === 1) fingerprint = hashArr[0].toString('hex')
    else {
      hashMaker = crypto.createHash('sha256')
      hashMaker.update(hashArr[0])
      for(let i = 1; i < hashArr.length; i++) {
        hashMaker.update(hashArr[i])
        let digest = hashMaker.digest()
        if (i === hashArr.length - 1) fingerprint = digest.toString('hex')
        else {
          hashMaker = crypto.createHash('sha256')
          hashMaker.update(digest)
        }
      }
    }

    // console.log('received-----------', fingerprint)
    // let aaa = 'd4be8322a0978cf6398d9dce471104d38b7da95692d51403121ffe4f8e174485'
    // if (fingerprint === aaa) {
    //   console.log(fs.statSync(tmpPath).size)
    //   let s = fs.readFileSync(tmpPath)
    //   console.log('=-==========',s.toString())
    // }
    let received = { total, fingerprint, tmpPath }
    callback(received)
  })

  ws.on('drain', () => {
    rs.resume()
  })
}

router.post('/:boxUUID/tweets', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID

  /**
  if (req.is('multipart/form-data')) {
    // UPLOAD
    let form = new formidable.IncomingForm()
    form.hash = 'sha256'
    let sha256, comment, type, size, error, data, arr, obj
    let urls = []
    let finished = false, formFinished = false, fileFinished = false

    const finalize = () => {
      if (finished) return
      if (formFinished) {
        finished = true
        if (error)
          return res.status(500).json({ code: error.code, message: error.message })
        else 
          return res.status(200).json(data)
      }
    }

    const check = (size, sha256, file) => {
      if (!Number.isInteger(size) || size !== file.size) 
        return finished = true && res.status(409).end()

      if (file.hash !== sha256) {
        return rimraf(file.path, err => {
          if (err) return finished = true && res.status(500).json({ code: err.code, message: err.message})
          return finished = true && res.status(409).end()
        })
      }
    }

    form.on('field', (name, value) => {
      if (finished) return

      if (name === 'blob' || name === 'list') {
        obj = JSON.parse(value)

        if (typeof obj.comment === 'string') comment = obj.comment
        if (obj.type) type = obj.type

        if (type === 'blob') {
          if (Number.isInteger(obj.size)) size = obj.size
          if (isSHA256(obj.sha256)) sha256 = obj.sha256
        }

        if (type === 'list') arr = obj.list
          // {
          //   size,
          //   sha256,
          //   filename, (optional, for file)
          //   id (uuid, identifier)
          // }
      }
    })

    form.on('fileBegin', (name, file) => {
      if (finished) return
      let tmpdir = getFruit().getTmpDir()
      file.path = path.join(tmpdir, UUID.v4())
    })

    form.on('file', (name, file) => {
      if (finished) return

      // file.hash = await fingerprintSimpleAsync(file.path)

      if (type === 'blob') {
        check(size, sha256, file)
        urls.push({sha256, filepath: file.path})
      }

      if (type === 'list') {
        // let id = JSON.parse(file.name).id
        // let index = arr.findIndex(i => i.id === id)
        let index = arr.findIndex(i => i.sha256 === file.hash)

        if (index !== -1) {
          check(arr[index].size, arr[index].sha256, file)          
          urls.push({sha256: file.hash, filepath: file.path})
          arr[index].finish = true
        } else {
          rimraf(file.path, () => {})
        }
      }
    })

    form.on('error', err => {
      if (finished) return
      return finished = true && res.status(500).json({ code: err.code, message: err.message })
    })
    
    form.on('aborted', () => {
      if (finished) return
      return finished = true && res.status(500).json({
        code: 'EABORTED',
        message: 'aborted'
      })
    })

    form.on('end', () => {
      formFinished = true

      if (type === 'blob' || arr.every(i => i.finish)) {
        let props
        if(type === 'blob') props = { comment, type, id: sha256, src: urls}
        else {
          let list = obj.list.map(i => { return {sha256: i.sha256, filename: i.filename} })
          props = {comment, type, list, src: urls}
        }

        getFruit().createTweetAsync(req.user, boxUUID, props)
          .then(result => {
            data = result
            finalize()
          })
          .catch(err => {
            error = err
            finalize()
          }) 
      } else {
        return finished = true && res.status(404).json({ 
          code: 'EFILE',
          message: 'necessary file not uploaded'
        })
      }
    })

    form.parse(req)

  } else if (req.is('application/json')) {
    getFruit().createTweetAsync(req.user, boxUUID, req.body)
      .then(tweet => res.status(200).json(tweet))
      .catch(next)
  } else
    return res.status(415).end()
  **/

  if (req.is('multipart/form-data')) {
    const regex = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i
    const m = regex.exec(req.headers['content-type'])
    let obj, comment, type, size, sha256, arr
    let urls = []

    dicer = new Dicer({ boundary: m[1] || m[2] })

    const onField = rs => {
      rs.on('data', data => {
        obj = JSON.parse(data)
        if (typeof obj.comment === 'string') comment = obj.comment
        if (obj.type) type = obj.type

        if (type === 'blob') {
          if (Number.isInteger(obj.size)) size = obj.size
          if (isSHA256(obj.sha256)) sha256 = obj.sha256
        }

        if (type === 'list') arr = obj.list
      })
    }

    const onFile = (rs, props) => {
      try {
        validate(props)
      } catch(e) {
        errorHandler()
        return res.status(e.status).json(e)
      }

      dataHandler(rs, received => {
        check(props.size, props.sha256, received)
        if (type === 'blob') { 
          // check received file and data given in field
          check(size, sha256, received)
          urls.push({sha256, filepath: received.tmpPath})
        }

        if (type === 'list') {
          let index = arr.findIndex(i => i.sha256 === received.fingerprint)
          if (index !== -1) {
            check(arr[index].size, arr[index].sha256, received)
            urls.push({sha256: arr[index].sha256, filepath: received.tmpPath})
            arr[index].finish = true
          } else {
            rimraf(tmpPath, () => {})
          }
        }
      })
    }

    dicer.on('part', part => {
      part.on('error', err => {
        part.removeAllListeners()
        part.on('error', () => {})
        errorHandler(dicer, req)
        return res.status(err.status).json(err)
      })

      part.on('header', header => {
        let props
        try {
          props = parseHeader(header)
        } catch(e) {
          part.on('error', () => {})
          e.status = 400
          errorHandler(dicer, req)
          return res.status(e.status).json(e)
        }

        if (props.type === 'field') {
          onField(part)
        } else {
          onFile(part, props)
        }
      })
    })
    
    dicer.on('finish', () => {
      if (type === 'blob' || arr.every(i => i.finish)) {
        let props
        if (type === 'blob') props = { comment, type, id: sha256, src: urls}
        else {
          let list = obj.list.map(i => { return {sha256: i.sha256, filename: i.filename} })
          props = {comment, type, list, src: urls}
        }

        getFruit().createTweetAsync(req.user, boxUUID, props)
          .then(tweet => res.status(200).json(tweet))
          .catch(next) 
      } else {
        let e = new Error('necessary file not uploaded')
        e.status = 404
        errorHandler(dicer, req)
        return res.status(e.status).json(e)
      }
    })

    req.pipe(dicer)

  } else if (req.is('application/json')) {
    getFruit().createTweetAsync(req.user, boxUUID, req.body)
      .then(tweet => res.status(200).json(tweet))
      .catch(next)
  } else
    return res.status(415).end()
})

router.get('/:boxUUID/tweets', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let { first, last, count, segments } = req.query
  let props = { first, last, count, segments }
  
  getFruit().getTweetsAsync(req.user, boxUUID, props)
    .then(data => res.status(200).json(data))
    .catch(next)
})

router.delete('/:boxUUID/tweets', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let indexArr = req.body.indexArr

  getFruit().deleteTweetsAsync(req.user, boxUUID, indexArr)
    .then(() => res.status(200).end())
    .catch(next)
})

router.get('/:boxUUID/commits/:commitHash', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let commitHash = req.params.commitHash

  getFruit().getCommitAsync(req.user, boxUUID, commitHash)
    .then(data => res.status(200).json(data))
    .catch(next)
})

router.get('/:boxUUID/trees/:treeHash', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID
  let treeHash = req.params.treeHash
  getFruit().getTreeListAsync(req.user, boxUUID, treeHash)
    .then(data => res.status(200).json(data))
    .catch(next)
})

router.post('/:boxUUID/commits', fruitless, auth, (req, res, next) => {
  let boxUUID = req.params.boxUUID

  if (req.is('multipart/form-data')) {
    const regex = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i
    const m = regex.exec(req.headers['content-type'])
    let obj, uploaded = new Set()

    // obj: {root, toUpload, parent, branch}
    // root is required the others are optional
    const onField = rs => {
      rs.on('data', data => {
        obj = JSON.parse(data)
      })
    }

    // props: {type: 'file', name, fromName, toName, size, sha256}
    // properties of file uploaded, given in header
    const onFile = (rs, props) => {
      try {
        validate(props)
      } catch(e) {
        errorHandler()
        return res.status(e.status).json(e)
      }

      dataHandler(rs, received => {
        check(props.size, props.sha256, received)
        fs.renameSync(received.tmpPath, path.join(getFruit().getTmpDir(), received.fingerprint))
        uploaded.add(received.fingerprint)
      })
    }

    dicer = new Dicer({ boundary: m[1] || m[2] })

    dicer.on('part', part => {
      part.on('error', err => {
        part.removeAllListeners()
        part.on('error', () => {})
        errorHandler(dicer, req)
        return res.status(err.status).json(err)
      })

      part.on('header', header => {
        let props
        try {
          props = parseHeader(header)
        } catch(e) {
          part.on('error', () => {})
          e.status = 400
          errorHandler(dicer, req)
          return res.status(e.status).json(e)
        }

        if (props.type === 'field') {
          onField(part)
        } else {
          onFile(part, props)
        }
      })
    })

    dicer.on('finish', () => {
      if (uploaded.size !== 0) obj.uploaded = [...uploaded]
      getFruit().createCommitAsync(req.user, boxUUID, obj)
        .then(commit => res.status(200).json(commit))
        .catch(next) 
    })

    req.pipe(dicer)

  } else if (req.is('application/json')) {
    getFruit().createCommitAsync(req.user, boxUUID, req.body)
      .then(commit => res.status(200).json(commit))
      .catch(next) 
  } else {
    return res.status(415).end()
  }
})

module.exports = router
