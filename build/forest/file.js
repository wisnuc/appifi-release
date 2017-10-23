const debug = require('debug')('fruitmix:file')

const Node = require('./node')
const xtractMetadata = require('../lib/metadata')
const xfingerprint = require('../lib/xfingerprint')
const hash = require('../lib/hash')

const debugi = require('debug')('fruitmix:indexing')

/**
File is a in-memory file node maintaining (some) xstat props and related tasks.

There are four state combinations for a file in terms of magic and hash props:

1. ~~magic is number, no hash~~
2. ~~magic is number, with hash~~
3. magic is string, no hash
4. magic is string, with hash

In this version, only files with magic string are maintained in memory. This dramatically reduces the memory footprint.

Another (experimental) state introduced in this version is `paused`. Any operations changing file system path (structure) should `pause` all workers in sub-tree, and `resume` them after the operation.

We have three choices in code pattern:

+ Immutable state machine. We don't use this pattern for two reasons
  + performance penalties
  + all files with magic string are indexed
  + file object may be reference with a hash worker.
+ Standard State Pattern in GoF book. We don't use this pattern either for it has two layers of objects.
+ Good old C Pattern. We starts from this pattern.

In our good old C pattern, only `hashed` and `hashless` are used as explicit states. But keep in mind that:
+ `paused` is a parallel state and shoule persist during state transfer.
+ new xstat may drop magic string. The Directory class should take care of this. Before removing a File object, the desctructor method (`exit`) should be called. Or, the `update` method cleans up everything before returning a null.
*/
class File extends Node {

  constructor (ctx, parent, xstat) {
    if (typeof xstat.magic !== 'string') { 
      throw new Error('file must have magic string') 
    }

    if (xstat.hash !== undefined && typeof xstat.hash !== 'string') { 
      throw new Error('xstat hash must be string or undefined') 
    }

    super(ctx, parent, xstat)

    this.uuid = xstat.uuid
    this.name = xstat.name

    /**
    file magic string. For xstat, magic may be a number or a string. But for file object, only string is accepted.
    Magic change is possible when file content changes. It may changes to another media type or to a number. The latter means this file object is going to be destroyed.
    @type {string}
    */
    this.magic = xstat.magic

    /**
    file hash. Updating file hash is considered to be a state transfer.
    @type {(string|undefined)}
    */
    this.hash = xstat.hash

    this.ctx.onFileCreated(this)
  }

  /**
  Destroys this file node
  */
  destroy () {
    this.ctx.onFileDestroying(this)
    super.destroy()
  }

  /**
  Update this object with xstat. This function should only be called by directory when updating.
  Only name and hash can be changed.
  */
  update (xstat) {
    if (xstat.uuid !== this.uuid) throw new Error('uuid mismatch')
    if (this.name === xstat.name && this.hash === xstat.hash) return
    this.ctx.onFileUpdating(this)
    this.name = xstat.name
    this.hash = xstat.hash
    this.ctx.onFileUpdated(this)
  }

}

module.exports = File
