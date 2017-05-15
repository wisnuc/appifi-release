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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _worker = require('../lib/worker');

var _worker2 = _interopRequireDefault(_worker);

var _command = require('../lib/command');

var _command2 = _interopRequireDefault(_command);

var _types = require('../lib/types');

var _xstat = require('./xstat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Hash = function (_Worker) {
  (0, _inherits3.default)(Hash, _Worker);

  function Hash(fpath, uuid) {
    (0, _classCallCheck3.default)(this, Hash);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Hash.__proto__ || (0, _getPrototypeOf2.default)(Hash)).call(this));

    _this.fpath = fpath;
    _this.uuid = uuid;
    _this.cmd = undefined;
    _this.hash = undefined;
    return _this;
  }

  (0, _createClass3.default)(Hash, [{
    key: 'cleanUp',
    value: function cleanUp() {
      this.cmd && this.cmd();
    }
  }, {
    key: 'run',
    value: function run() {
      var _this2 = this;

      _fs2.default.lstat(this.fpath, function (err, stats) {
        return _this2.finished ? undefined : err ? _this2.error(err) : !stats.isFile() ? _this2.error(new _error2.default.ENOTFILE()) : _this2.cmd = (0, _command2.default)('openssl', ['dgst', '-sha256', '-r', _this2.fpath], function (err, data) {
          return _this2.finished ? undefined : err ? _this2.error(err) : !(0, _types.isSHA256)(_this2.hash = data.toString().trim().split(' ')[0]) ? _this2.error(new _error2.default.FORMAT()) : _fs2.default.lstat(_this2.fpath, function (err, stats2) {
            return _this2.finished ? undefined : err ? _this2.error(err) : !stats.isFile() ? _this2.error(new _error2.default.ENOTFILE()) : stats.mtime.getTime() !== stats2.mtime.getTime() ? _this2.error(new _error2.default.ETIMESTAMP()) : (0, _xstat.updateFileHash)(_this2.fpath, _this2.uuid, _this2.hash, stats.mtime.getTime(), function (err, xstat) {
              return _this2.finished ? undefined : err ? _this2.error(err) : _this2.finish(xstat);
            });
          });
        });
      });
    }
  }]);
  return Hash;
}(_worker2.default);

exports.default = function (fpath, uuid) {
  return new Hash(fpath, uuid);
};