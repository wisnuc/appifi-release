'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HashMagic = function (_EventEmitter) {
  (0, _inherits3.default)(HashMagic, _EventEmitter);

  function HashMagic() {
    (0, _classCallCheck3.default)(this, HashMagic);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(HashMagic).call(this));

    _this.clear();
    return _this;
  }

  // internal method


  (0, _createClass3.default)(HashMagic, [{
    key: 'clear',
    value: function clear() {
      this.target = null;
      this.uuid = null;
      this.timestamp = null;

      this.hashSpawn = null;
      this.hash = null;
      this.hashExitCode = null;

      this.magicSpawn = null;
      this.magic = null;
      this.magicExitCode = null;
      this.state = 'IDLE'; // or BUSY
    }

    // start the worker

  }, {
    key: 'start',
    value: function start(target, uuid) {
      var _this2 = this;

      if (this.state !== 'IDLE') return;

      console.log('[hashMagicWorker]: ' + target + ' ' + uuid);
      this.state = 'BUSY';
      this.target = target;
      this.uuid = uuid;

      _fs2.default.stat(target, function (err, stats) {

        if (err) return _this2.end({ err: err });

        if (!stats.isFile()) {
          var _err = new Error('target must be file');
          _err.code = 'EINVAL';
          return _this2.end({ err: _err });
        }

        // record timestamp
        _this2.timestamp = stats.mtime.getTime();

        _this2.hashSpawn = _child_process2.default.spawn('openssl', ['dgst', '-sha256', '-r', _this2.target]);
        _this2.hashSpawn.stdout.on('data', function (data) {
          if (_this2.state !== 'BUSY') return;
          var hash = data.toString().trim().split(' ')[0];
          _this2.hash = hash;
        });

        _this2.hashSpawn.on('close', function (code) {
          _this2.hashSpawn = null;
          if (_this2.state !== 'BUSY') return;
          if (code === 0 && _this2.magicExitCode === 0) _this2.end();else if (code !== 0) _this2.end(new Error('openssl exit code ' + code));else _this2.hashExitCode = code;
        });

        _this2.magicSpawn = _child_process2.default.spawn('file', ['-b', _this2.target]);
        _this2.magicSpawn.stdout.on('data', function (data) {
          if (_this2.state !== 'BUSY') return;
          var magic = data.toString().trim();
          _this2.magicSpawn = null;
          _this2.magic = magic;
        });

        _this2.magicSpawn.on('close', function (code) {
          _this2.magicSpawn = null;
          if (_this2.state !== 'BUSY') return;
          if (code === 0 && _this2.hashExitCode === 0) _this2.end();else if (code !== 0) _this2.end(new Error('file exit code ' + code));else _this2.magicExitCode = code;
        });
      });
    }

    // abort current job, won't fire 'end'

  }, {
    key: 'abort',
    value: function abort() {

      if (this.state !== 'BUSY') return;
      if (this.hashSpawn) this.hashSpawn.kill();
      if (this.magicSpawn) this.magicSpawn.kill();

      var error = new Error('hash magic job aborted');
      error.code = 'EABORT';
      this.end(error);
    }
  }, {
    key: 'end',
    value: function end(err) {
      var _this3 = this;

      var ret = void 0;
      if (err) ret = { err: err, uuid: this.uuid, target: this.target };else ret = { err: null, uuid: this.uuid, target: this.target, hash: this.hash, magic: this.magic, timestamp: this.timestamp };

      // unwind the stack
      process.nextTick(function () {
        return _this3.emit('end', ret);
      });
      this.clear();
    }
  }]);
  return HashMagic;
}(_events2.default);

exports.default = function () {
  return new HashMagic();
};