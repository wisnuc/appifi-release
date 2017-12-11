const Node = require('./node')
const State = require('./state')

/**
`Pending` state for directory sub-task

@memberof XCopy.Dir
@extends XCopy.State
*/
class Pending extends State {

  enter () {
    this.ctx.ctx.indexPendingDir(this.ctx)
  }

  exit () {
    this.ctx.ctx.unindexPendingDir(this.ctx)
  } 

}

/**
`Working` state for directory sub-task

The destination directory (`dst`) should be created in this state.

@memberof XCopy.Dir
@extends XCopy.State
*/
class Working extends State {

  enter () {
    this.ctx.ctx.indexWorkingDir(this.ctx)

    let policy = this.ctx.getPolicy()
    let [same, diff] = policy
    if (same === 'keep') same = 'skip'
    this.mkdir([same, diff], (err, dst, resolved) => {
      if (err && err.code === 'EEXIST') {
        this.setState('Conflict', err, policy)
      } else if (err) {
        this.setState('Failed', err)
      } else {
        if (policy[0] === 'skip' && resolved[0]) {
          this.setState('Finished')
        } else {
          this.ctx.dst = dst
          this.setState('Reading')
        }
      }
    })
  }

  // abstract
  mkdir (policy, callback) {
    process.nextTick(() => callback(new Error('this function must be implemented by inherited class'))) 
  }

  exit () {
    this.ctx.ctx.unindexWorkingDir(this.ctx)
  } 

}

/**
`Conflict` state for directory sub-task

@memberof XCopy.Dir
@extends XCopy.State
*/
class Conflict extends State {

  enter (err, policy) {
    this.ctx.ctx.indexConflictDir(this.ctx)
    this.err = err
    this.policy = policy
  }

  exit () {
    this.ctx.ctx.unindexConflictDir(this.ctx)
  }

  view () {
    return {
      error: {
        code: this.err.code,
        xcode: this.err.xcode,
        message: this.err.message
      },
      policy: this.policy
    }
  }

}

/**
`Reading` state for directory sub-task

@memberof XCopy.Dir
@extends XCopy.State
*/
class Reading extends State {

  enter () {
    this.ctx.ctx.indexReadingDir(this.ctx)
    this.read((err, xstats) => {
      if (this.ctx.isDestroyed()) return
      if (err) {
        this.setState('Failed', err)
      } else {
        this.setState('Read', xstats)
      }
    })
  } 

  read (callback) {
    this.ctx.ctx.readdir(this.ctx.src.uuid, callback)
  }

  exit () {
    this.ctx.ctx.unindexReadingDir(this.ctx)
  }

}

/**
`Read` state for directory sub-task

@memberof XCopy.Dir
@extends XCopy.State
*/
class Read extends State {

  enter (xstats) {
    this.ctx.ctx.indexReadDir(this.ctx)

    this.dstats = xstats.filter(x => x.type === 'directory')
    this.fstats = xstats.filter(x => x.type === 'file')
    this.next()
  }

  next () {
    if (this.fstats.length) {
      let stat = this.fstats.shift()
      let sub = this.ctx.createSubTask(stat) 
      sub.once('Conflict', () => this.next())
      sub.once('Failed', () => this.next())
      sub.once('Finished', () => (sub.destroy(), this.next()))
      return
    }

    if (this.dstats.length) {
      let stat = this.dstats.shift()
      let sub = this.ctx.createSubTask(stat) 
      sub.once('Conflict', () => this.next())
      sub.once('Failed', () => this.next())
      sub.once('Finished', () => (sub.destroy(), this.next()))
      return
    }

    if (this.ctx.children.length === 0) {
      this.setState('Finished')
    }
  }

  exit () {
    this.ctx.ctx.unindexReadDir(this.ctx)
  }

}

/**
`Failed` state for directory sub-task

@memberof XCopy.Dir
@extends XCopy.State
*/
class Failed extends State {
  // when directory enter failed 
  // all descendant node are destroyed (but not removed)
  enter (err) {
    this.ctx.ctx.indexFailedDir(this.ctx)

    let children = [...this.ctx.children]
    children.forEach(c => c.destroy())

    this.err = err
  }

  exit () {
    this.ctx.ctx.unindexFailedDir(this.ctx)
  }

  view () {
    return {
      error: {
        code: this.err.code,
        message: this.err.message
      }
    } 
  }
}

/**
`Finished` state for directory sub-task

@memberof XCopy.Dir
@extends XCopy.State
*/
class Finished extends State {

  enter () {
    this.ctx.ctx.indexFinishedDir(this.ctx)
  }

  exit () {
    this.ctx.ctx.unindexFinishedDir(this.ctx)
  }

}

/**
The base class of sub-task for directory.

@memberof XCopy
@extends XCopy.Node
*/
class Dir extends Node {

  constructor(ctx, parent, src, dst, entries) {
    super(ctx, parent)
    this.children = []
    this.src = src
    if (dst) {
      this.dst = dst
      new this.Read(this, entries)
    } else {
      new this.Pending(this)
    }
  }

  get type () {
    return 'directory'
  }

  destroy () {
    let children = [...this.children]
    children.forEach(c => c.destroy())
    super.destroy()
  }

  getPolicy () {
    return [
      this.policy[0] || this.ctx.policies.dir[0] || null,
      this.policy[1] || this.ctx.policies.dir[1] || null
    ]  
  }

  // virtual
  createSubTask (xstat) { 
    let src = { uuid: xstat.uuid, name: xstat.name } 
    if (xstat.type === 'directory') {
      return new this.constructor(this.ctx, this, src)
    } else {
      return new this.constructor.File(this.ctx, this, src)
    }
  }

}

Dir.prototype.Pending = Pending
Dir.prototype.Working = Working
Dir.prototype.Reading = Reading
Dir.prototype.Read = Read
Dir.prototype.Conflict = Conflict
Dir.prototype.Finished = Finished
Dir.prototype.Failed = Failed

module.exports = Dir





