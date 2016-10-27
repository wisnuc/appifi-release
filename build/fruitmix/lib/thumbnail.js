'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _paths = require('./paths');

var _paths2 = _interopRequireDefault(_paths);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ERROR = function ERROR(code, _text) {
  return function (text) {
    return (0, _assign2.default)(new Error(text || _text), { code: code });
  };
};

var EFAIL = ERROR('EFAIL', 'operation failed');
var EINVAL = ERROR('EINVAL', 'invalid argument');
var EINTR = ERROR('EINTR', 'operation interrupted');
var ENOENT = ERROR('ENOENT', 'entry not found');

// a simple version to avoid canonical json, for easy debug
var stringify = function stringify(object) {
  return (0, _stringify2.default)((0, _keys2.default)(object).sort().reduce(function (obj, key) {
    obj[key] = object[key];
    return obj;
  }, {}));
};

// hash stringified option object
var optionHash = function optionHash(opts) {
  return _crypto2.default.createHash('sha256').update(stringify(opts)).digest('hex');
};

// generate geometry string for convert
var geometry = function geometry(width, height, modifier) {

  var str = void 0;

  if (!height) str = '' + width.toString();else if (!width) str = 'x' + height.toString();else {
    str = width.toString() + 'x' + height.toString();

    switch (modifier) {
      case 'caret':
        str += '^';
      default:
    }
  }
  return str;
};

// parse query to opts
var parseQuery = function parseQuery(query) {
  var width = query.width,
      height = query.height,
      modifier = query.modifier,
      autoOrient = query.autoOrient;


  if (width !== undefined) {
    width = parseInt(width);
    if (!(0, _isInteger2.default)(width) || width === 0 || width > 4096) return EINVAL('invalid width');
  }

  if (height !== undefined) {
    height = parseInt(height);
    if (!(0, _isInteger2.default)(height) || height === 0 || height > 4096) return EINVAL('invalid height');
  }

  if (!width && !height) return EINVAL('no geometry');

  if (!width || !height) modifier = undefined;
  if (modifier && modifier !== 'caret') return EINVAL('unknown modifier');

  if (autoOrient !== undefined) {
    if (autoOrient !== 'true') return EINVAL('invalid autoOrient');
    autoOrient = true;
  }

  return { width: width, height: height, modifier: modifier, autoOrient: autoOrient };
};

// convert, return abort function
var convert = function convert(src, tmp, dst, opts, callback) {

  var finished = false;

  var args = [];
  args.push(src);
  if (opts.autoOrient) args.push('-auto-orient');
  args.push('-thumbnail');
  args.push(geometry(opts.width, opts.height, opts.modifier));
  args.push(tmp);

  var spawn = _child_process2.default.spawn('convert', args).on('error', function (err) {
    return CALLBACK(err);
  }).on('close', function (code) {
    spawn = null;
    if (finished) return;
    if (code !== 0) CALLBACK(EFAIL('convert spawn failed with exit code ${code}'));else _fs2.default.rename(tmp, dst, CALLBACK);
  });

  function CALLBACK(err) {
    if (finished) return;
    if (spawn) spawn = spawn.kill();
    finished = true;
    callback(err);
  }

  return function () {
    return CALLBACK(EINTR());
  };
};

var createThumbnailer = function createThumbnailer() {

  var limit = 1;
  var jobs = [];

  // create a job, using function scope as context / object
  function createJob(key, digest, opts) {

    var intr = void 0,
        listeners = [];
    var dst = _path2.default.join(_paths2.default.get('thumbnail'), key);

    function run() {
      var src = _models2.default.getModel('filer').readMediaPath(digest);
      if (!src) return finish(ENOENT('src not found'));
      var tmp = _path2.default.join(_paths2.default.get('tmp'), _nodeUuid2.default.v4());
      intr = convert(src, tmp, dst, opts, finish);
    }

    function finish(err) {
      listeners.forEach(function (cb) {
        return err ? cb(err) : cb(null, dst);
      });
      intr = undefined;
      jobs.splice(jobs.findIndex(function (j) {
        return j.key === key;
      }), 1);
      schedule();
    }

    return {
      key: key, run: run,
      isRunning: function isRunning() {
        return !!intr;
      },
      addListener: function addListener(listener) {
        return listeners.push(listener);
      },
      abort: function abort() {
        return intr && (intr = intr());
      }
    };
  }

  function schedule() {

    var diff = limit - jobs.filter(function (job) {
      return job.isRunning();
    }).length;
    if (diff <= 0) return;

    jobs.filter(function (job) {
      return !job.isRunning();
    }).slice(0, diff).forEach(function (job) {
      return job.run();
    });
  }

  function generate(key, digest, opts) {

    var job = jobs.find(function (j) {
      return j.key === key;
    });
    if (job) return job;

    job = createJob(key, digest, opts);
    jobs.push(job);
    if (jobs.filter(function (job) {
      return job.isRunning();
    }).length < limit) job.run();
    return job;
  }

  function abort() {

    jobs.filter(function (job) {
      return job.isRunning();
    }).forEach(function (job) {
      return job.abort();
    });
    jobs = [];
  }

  function request(digest, query, callback) {

    var opts = parseQuery(query);
    if (opts instanceof Error) return process.nextTick(callback, opts);

    var key = digest + optionHash(opts);
    var thumbpath = _path2.default.join(_paths2.default.get('thumbnail'), key);

    // find the thumbnail file first
    _fs2.default.stat(thumbpath, function (err, stat) {

      // if existing, return path for instant, or status ready for pending
      if (!err) return callback(null, thumbpath);

      // if error other than ENOENT, return err
      if (err.code !== 'ENOENT') return callback(err);

      // request a job to generate thumbnail 
      var job = generate(key, digest, opts);

      if (query.nonblock === 'true') {
        if (job.isRunning()) {
          callback({ status: 'running' });
        } else {
          callback({ status: 'pending' });
        }
      } else {
        if (job.isRunning()) {
          job.addListener(callback);
        } else {
          callback({ status: 'pending' });
        }
      }
    });
  }

  return { request: request, abort: abort };
};

exports.default = createThumbnailer;

/**
  class Job {

    constructor(key, digest, opts) {
      this.key = key
      this.digest = digest
      this.opts = opts
      this.listeners = []
    }

    addListener(listener) {
      this.listeners.push(listener)
    }

    isRunning() {
      return !!this.abort
    }

    run() {

      const src = models.getModel('filer').readMediaPath(this.digest)
      if (!src) 
        return process.nextTick(finish, Object.assign(new Error('src not found'), {
          code: 'ENOENT'
        }))

      const tmp = path.join(paths.get('tmp'), UUID.v4())
      const dst = path.join(paths.get('thumbnail'), this.key)

      const finish = (err) => {
        this.listeners.forEach(cb => {
          err ? cb(err) : cb(null, dst)
        })
        this.abort = null 
        jobs.splice(jobs.indexOf(this), 1)
        schedule()
      }

      // install new methods
      this.abort = convert(src, tmp, dst, this.opts, finish)
    }
  }
**/