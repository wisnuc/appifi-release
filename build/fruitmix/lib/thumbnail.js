'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

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

// a simple version to avoid canonical json, for easy debug
var stringify = function stringify(object) {
  return (0, _stringify2.default)((0, _keys2.default)(object).sort().reduce(function (obj, key) {
    obj[key] = object[key];
    return obj;
  }, {}));
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

// hash object
var optionHash = function optionHash(opts) {
  return _crypto2.default.createHash('sha256').update(stringify(opts)).digest('hex');
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
    if (code !== 0) CALLBACK((0, _assign2.default)(new Error('convert spawn failed with exit code ${code}'), { code: 'EFAIL' }));else _fs2.default.rename(tmp, dst, CALLBACK);
  });

  function CALLBACK(err) {
    if (finished) return;
    if (spawn) spawn.kill();
    spawn = null;
    finished = true;
    callback(err);
  }

  return function () {
    return CALLBACK((0, _assign2.default)(new Error('aborted'), { code: 'EINTR' }));
  };
};

// parse query to opts
var parseQuery = function parseQuery(query) {

  var EINVAL = function EINVAL(text) {
    return (0, _assign2.default)(new Error(text || 'invalid argument'), { code: 'EINVAL' });
  };

  var width = query.width;
  var height = query.height;
  var modifier = query.modifier;
  var autoOrient = query.autoOrient;


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

  return {
    width: width,
    height: height,
    modifier: modifier,
    autoOrient: autoOrient
  };
};

var createThumbnailer = function createThumbnailer() {

  var limit = 1;
  var jobs = [];

  var Job = function () {
    function Job(key, digest, opts) {
      (0, _classCallCheck3.default)(this, Job);

      this.key = key;
      this.digest = digest;
      this.opts = opts;
      this.listeners = [];
    }

    (0, _createClass3.default)(Job, [{
      key: 'addListener',
      value: function addListener(listener) {
        this.listeners.push(listener);
      }
    }, {
      key: 'isRunning',
      value: function isRunning() {
        return !!this.abort;
      }
    }, {
      key: 'run',
      value: function run() {
        var _this = this;

        var src = _models2.default.getModel('forest').readMediaPath(this.digest);
        if (!src) return process.nextTick(finish, (0, _assign2.default)(new Error('src not found'), {
          code: 'ENOENT'
        }));

        var tmp = _path2.default.join(_paths2.default.get('tmp'), _nodeUuid2.default.v4());
        var dst = _path2.default.join(_paths2.default.get('thumbnail'), this.key);

        var finish = function finish(err) {
          _this.listeners.forEach(function (cb) {
            err ? cb(err) : cb(null, dst);
          });
          _this.abort = null;
          jobs.splice(jobs.indexOf(_this), 1);
          schedule();
        };

        // install new methods
        this.abort = convert(src, tmp, dst, this.opts, finish);
      }
    }]);
    return Job;
  }();

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

    job = new Job(key, digest, opts);
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