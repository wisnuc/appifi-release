'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHashMagicBuilder = exports.HashMagicBuilder = exports.createWorker = undefined;

var _setImmediate2 = require('babel-runtime/core-js/set-immediate');

var _setImmediate3 = _interopRequireDefault(_setImmediate2);

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

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _xstat = require('./xstat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// this function is responsible for update xattr of target file
// and returns xstat after updateXattrHashMagic succeeds.
var createWorker = exports.createWorker = function createWorker(target, uuid, callback) {

  var finished = false;

  var timestamp = void 0;
  var hash = null,
      magic = null;

  var file = void 0,
      openssl = void 0;
  var count = 2;

  (0, _xstat.readXstat)(target, function (err, xstat) {

    if (finished) return;
    if (err) return CALLBACK(err);
    if (xstat.isDirectory()) return CALLBACK((0, _assign2.default)(new Error('target must be a file'), { code: 'EISDIR' }));
    if (xstat.uuid !== uuid) return CALLBACK((0, _assign2.default)(new Error('uuid mismatch'), { code: 'EMISMATCH' }));

    timestamp = xstat.mtime.getTime();

    openssl = _child_process2.default.spawn('openssl', ['dgst', '-sha256', '-r', target]);
    openssl.stdout.on('data', function (data) {
      if (finished) return;
      var str = data.toString().trim().slice(0, 64);
      if (/^[0-9a-f]{64}$/.test(str)) hash = str;
    });

    openssl.on('close', function (code) {
      openssl = null;
      if (finished) return;
      if (code !== 0 || !hash) {
        if (file) file.kill();
        return CALLBACK((0, _assign2.default)(new Error('openssl failed'), { code: 'EFAIL' }));
      }
      next();
    });

    file = _child_process2.default.spawn('file', ['-b', target]);
    file.stdout.on('data', function (data) {
      if (finished) return;
      var str = data.toString().trim();
      if (str.length) magic = str;
    });

    file.on('close', function (code) {
      file = null;
      if (finished) return;
      if (code !== 0 || !magic) {
        if (openssl) openssl.kill();
        return CALLBACK((0, _assign2.default)(new Error('file failed'), { code: 'EFAIL' }));
      }
      next();
    });
  });

  var next = function next() {
    return ! --count && (0, _xstat.updateXattrHashMagic)(target, uuid, hash, magic, timestamp, function (err, xstat) {
      return !finished && CALLBACK(err, xstat);
    });
  };

  var CALLBACK = function CALLBACK(err, xstat) {
    return (finished = true) && callback(err, xstat);
  };

  // abort function
  return function () {
    if (finished) return;
    if (openssl) {
      openssl.kill();
      openssl = null;
    }
    if (file) {
      file.kill();
      file = null;
    }
    CALLBACK((0, _assign2.default)(new Error('aborted'), { code: 'EABORT' }));
  };
};

var HashMagicBuilder = exports.HashMagicBuilder = function (_EventEmitter) {
  (0, _inherits3.default)(HashMagicBuilder, _EventEmitter);

  function HashMagicBuilder(filer) {
    var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    (0, _classCallCheck3.default)(this, HashMagicBuilder);

    var _this = (0, _possibleConstructorReturn3.default)(this, (HashMagicBuilder.__proto__ || (0, _getPrototypeOf2.default)(HashMagicBuilder)).call(this));

    _this.filer = filer;
    _this.limit = limit;
    _this.running = []; // object array
    _this.pending = []; // uuid array

    _this.filer.on('hashMagic', function (node) {
      _this.handle(node);
    });
    return _this;
  }

  (0, _createClass3.default)(HashMagicBuilder, [{
    key: 'createJob',
    value: function createJob(node) {
      var _this2 = this;

      // console.log(`creating job for ${node.uuid}`)

      var uuid = node.uuid;
      var abort = createWorker(node.namepath(), uuid, function (err, xstat) {
        return _this2.jobDone(err, xstat, job);
      });

      var job = { uuid: uuid, abort: abort };
      this.running.push(job);
    }
  }, {
    key: 'jobDone',
    value: function jobDone(err, xstat, job) {
      var _this3 = this;

      // console.log(`job for ${job.uuid} done`)

      if (err) {
        switch (err.code) {
          case 'EABORT':
            break;
          default:
            break;
        }
      } else {
        this.filer.updateFileNode(xstat);
      }

      this.running.splice(this.running.indexOf(job), 1);
      if (!this.running.length && !this.pending.length) {
        // process.nextTick(() => this.emit('hashMagicBuilderStopped'))
        // setImmediate(() => this.emit('hashMagicBuilderStopped'))
        this.emit('hashMagicBuilderStopped');
      }

      // process.nextTick(() => this.schedule())
      (0, _setImmediate3.default)(function () {
        return _this3.schedule();
      });
    }
  }, {
    key: 'schedule',
    value: function schedule() {

      while (this.limit - this.running.length > 0 && this.pending.length) {
        var uuid = this.pending.shift();
        var node = this.filer.findNodeByUUID(uuid);
        if (node) this.createJob(node);
      }
    }
  }, {
    key: 'handle',
    value: function handle(node) {

      if (this.aborted) return;
      if (this.running.find(function (r) {
        return r.uuid === node.uuid;
      })) return;
      if (this.pending.find(function (id) {
        return id === node.uuid;
      })) return;

      if (this.running.length >= this.limit) this.pending.push(node.uuid);else {
        this.createJob(node);
        if (this.running.length === 1 && this.pending.length === 0) {
          // using nextTick is stack friendly and safer, say, user may call abort in handler
          // process.nextTick(() => this.emit('hashMagicBuilderStarted'))
          // setImmediate(() => this.emit('hashMagicBuilderStarted'))
          this.emit('hashMagicBuilderStarted');
        }
      }
    }
  }, {
    key: 'abort',
    value: function abort() {

      this.pending = [];
      this.running.forEach(function (job) {
        return job.abort();
      });
      this.aborted = true;
    }
  }]);
  return HashMagicBuilder;
}(_events2.default);

var createHashMagicBuilder = exports.createHashMagicBuilder = function createHashMagicBuilder(filer, limit) {
  return new HashMagicBuilder(filer, limit);
};