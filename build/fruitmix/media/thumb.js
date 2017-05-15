'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _config = require('../cluster/config');

var _config2 = _interopRequireDefault(_config);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _const = require('../lib/const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');
var child = require('child_process');
var crypto = require('crypto');
var EventEmitter = require('events');
var UUID = require('node-uuid');
var Promise = require('bluebird');

var ERROR = function ERROR(code, _text) {
  return function (text) {
    return (0, _assign2.default)(new Error(text || _text), { code: code });
  };
};

var EFAIL = ERROR('EFAIL', 'operation failed');
var EINVAL = ERROR('EINVAL', 'invalid argument');
// const EINTR = ERROR('EINTR', 'operation interrupted')
// const ENOENT = ERROR('ENOENT', 'entry not found')

// a simple version to avoid canonical json, for easy debug
var stringify = function stringify(object) {
  return (0, _stringify2.default)((0, _keys2.default)(object).sort().reduce(function (obj, key) {
    obj[key] = object[key];
    return obj;
  }, {}));
};

// hash stringified option object
var optionHash = function optionHash(opts) {
  return crypto.createHash('sha256').update(stringify(opts)).digest('hex');
};

// generate geometry string for convert
var geometry = function geometry(width, height, modifier) {

  var str = void 0;
  if (!height) str = '' + width.toString();else if (!width) str = 'x' + height.toString();else {
    str = width.toString() + 'x' + height.toString();

    if (modifier === 'caret') {
      str += '^';
    }
    // switch (modifier) {
    //   case 'caret':
    //     str += '^'
    //     break
    //   default:
    // }
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
var convert = function convert(key, src, opts, callback) {

  var dst = path.join(_config2.default.path, _const.DIR.THUMB, key);
  var tmp = path.join(_config2.default.path, _const.DIR.TMP, UUID.v4());
  var args = [];

  args.push(src);
  if (opts.autoOrient) args.push('-auto-orient');
  args.push('-thumbnail');
  args.push(geometry(opts.width, opts.height, opts.modifier));
  args.push(tmp);

  child.spawn('convert', args).on('error', function (err) {
    callback(err);
  }).on('close', function (code) {
    if (code !== 0) {
      callback(EFAIL('convert spawn failed with exit code ${code}'));
    } else {
      return fs.rename(tmp, dst, callback);
    }
  });
};

var generate = function generate(key, src, opts, callback) {

  var thumbpath = path.join(_config2.default.path, _const.DIR.THUMB, key);
  // find the thumbnail file first
  fs.stat(thumbpath, function (err, stat) {

    // if existing, return path for instant, or status ready for pending
    if (!err) return callback(null, thumbpath);

    // if error other than ENOENT, return err
    if (err.code !== 'ENOENT') return callback(err);

    return convert(key, src, opts, callback);
  });
};

var recursive = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(count, key) {
    var thumbpath;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(count > 3)) {
              _context.next = 2;
              break;
            }

            throw new Error('get thumb error');

          case 2:
            thumbpath = path.join(_config2.default.path, _const.DIR.THUMB, key);
            _context.prev = 3;
            _context.next = 6;
            return (0, _bluebird.resolve)(Promise.promisify(fs.stat)(thumbpath));

          case 6:
            return _context.abrupt('return', thumbpath);

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](3);

            if (!(_context.t0.code !== 'ENOENT')) {
              _context.next = 13;
              break;
            }

            throw _context.t0;

          case 13:
            count++;
            recursive(count, key);

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[3, 9]]);
  }));

  return function recursive(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var Worker = function (_EventEmitter) {
  (0, _inherits3.default)(Worker, _EventEmitter);

  function Worker(hash, src, opts) {
    (0, _classCallCheck3.default)(this, Worker);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Worker.__proto__ || (0, _getPrototypeOf2.default)(Worker)).call(this));

    _this.finished = false;
    _this.state = 'pending';
    _this.id = hash;
    _this.count = 0;
    _this.src = src;
    _this.opts = opts;
    _this.cbMap = new _map2.default();
    return _this;
  }

  (0, _createClass3.default)(Worker, [{
    key: 'setCallback',
    value: function setCallback(requestId, cb) {
      this.cbMap.set(requestId, cb);
    }
  }, {
    key: 'start',
    value: function start() {
      if (this.finished) throw new Error('worker is already finished');
      this.run();
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      if (this.state != 'pending') return;
      this.state = 'running';

      generate(this.id, this.src, this.opts, function (err, data) {
        if (err) {
          return _this2.error(err);
        }
        // if no exist, try again
        if (!data) {
          recursive(_this2.count, _this2.id).then(function (result) {
            _this2.finish(_this2, result);
          }).catch(function (err) {
            return _this2.error(err);
          });
        } else {
          _this2.finish(_this2, data);
        }
      });
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.finished) throw new Error('worker is already finished');
      this.emit('error', new _error2.default.EABORT());
      this.exit();
    }
  }, {
    key: 'finish',
    value: function finish(data) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.emit.apply(this, ['finish', data].concat(args));
      this.reset();
    }
  }, {
    key: 'error',
    value: function error(err) {
      this.emit('error', err);
      this.exit();
    }
  }, {
    key: 'isRunning',
    value: function isRunning() {
      return this.state === 'running';
    }
  }, {
    key: 'exit',
    value: function exit() {
      this.finished = true;
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.finished = false;
      this.state === 'pending';
    }
  }]);
  return Worker;
}(EventEmitter);

var Thumb = function () {
  function Thumb(limit) {
    (0, _classCallCheck3.default)(this, Thumb);

    this.workingQ = [];
    this.limit = limit || 40;
  }

  (0, _createClass3.default)(Thumb, [{
    key: 'schedule',
    value: function schedule() {

      console.log('workingQ length: ', this.workingQ.length);
      var diff = this.limit - this.workingQ.filter(function (worker) {
        worker.isRunning();
      }).length;
      if (diff <= 0) return;

      this.workingQ.filter(function (worker) {
        return !worker.isRunning();
      }).slice(0, diff).forEach(function (worker) {
        return worker.start();
      });
    }

    /**
      src: src
      digest: 'string'
      userUUID： 'string'
      query: 'object' 
     */

  }, {
    key: 'request',
    value: function request(_ref2, callback) {
      var _this3 = this;

      var requestId = _ref2.requestId,
          src = _ref2.src,
          digest = _ref2.digest,
          query = _ref2.query;


      if (this.workingQ.length > 1040) {
        throw new Error('请求过于频繁');
      }
      var worker = this.createrWorker(requestId, src, digest, query, callback);
      worker.on('finish', function (worker, data) {
        // callback map
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          var _loop = function _loop() {
            var cb = _step.value;

            process.nextTick(function () {
              return cb(null, data);
            });
            _this3.workingQ.splice(_this3.workingQ.indexOf(worker), 1);
          };

          for (var _iterator = (0, _getIterator3.default)(worker.cbMap.values()), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            _loop();
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        _this3.schedule();
      });
      worker.on('error', function (worker) {
        _this3.workingQ.splice(_this3.workingQ.indexOf(worker), 1);
        _this3.workingQ.push(worker);
        _this3.schedule();
      });
      this.schedule();
    }

    // factory function

  }, {
    key: 'createrWorker',
    value: function createrWorker(requestId, src, digest, query, callback) {

      var opts = parseQuery(query);
      if (opts instanceof Error) return opts;

      var hash = digest + optionHash(opts);
      var worker = this.workingQ.find(function (worker) {
        return worker.id === hash;
      });
      if (!worker) {
        worker = new Worker(hash, src, opts);
        // worker.nonblock == true ?
        // this.pendingQ.unshift(worker) : this.pendingQ.push(worker)
        this.workingQ.push(worker);
      }
      worker.setCallback(requestId, callback);
      return worker;
    }
  }, {
    key: 'abort',
    value: function abort(_ref3) {
      var requestId = _ref3.requestId,
          digest = _ref3.digest,
          query = _ref3.query;


      var opts = parseQuery(query);
      if (opts instanceof Error) return opts;

      var hash = digest + optionHash(opts);
      //先找到woker，再去callbackArr找对应的callback
      var worker = this.workingQ.find(function (worker) {
        return worker.id === hash;
      });
      if (worker) return worker.cbMap.size === 1 ? this.workingQ.splice(this.workingQ.indexOf(worker), 1) : worker.cbMap.delete(requestId);
    }
  }]);
  return Thumb;
}();

exports.default = Thumb;