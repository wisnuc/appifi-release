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

var _xstat = require('./xstat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// the reason to prefer emitter version over closure one is:
// 1. easire to test
// 2. explicit state
// 3. can emit again (state) when error
var Probe = function (_Worker) {
  (0, _inherits3.default)(Probe, _Worker);

  function Probe(dpath, uuid, mtime, delay) {
    (0, _classCallCheck3.default)(this, Probe);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Probe.__proto__ || (0, _getPrototypeOf2.default)(Probe)).call(this));

    _this.dpath = dpath;
    _this.uuid = uuid;
    _this.mtime = mtime;
    _this.delay = delay;

    // this.finished = false
    _this.again = false;
    _this.timer = undefined;
    return _this;
  }

  (0, _createClass3.default)(Probe, [{
    key: 'cleanUp',
    value: function cleanUp() {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }, {
    key: 'readXstats',
    value: function readXstats(callback) {
      var _this2 = this;

      var count = void 0,
          xstats = [];
      _fs2.default.readdir(this.dpath, function (err, entries) {
        return _this2.finished ? undefined : err ? callback(err) : (count = entries.length) === 0 ? callback(null, []) : entries.forEach(function (ent) {
          return (0, _xstat.readXstat)(_path2.default.join(_this2.dpath, ent), function (err, xstat) {
            if (_this2.finished) return;
            if (!err) xstats.push(xstat);
            if (! --count) callback(null, xstats.sort(function (a, b) {
              return a.name.localeCompare(b.name);
            }));
          });
        });
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this3 = this;

      this.timer = setTimeout(function () {
        return (0, _xstat.readXstat)(_this3.dpath, function (err, xstat) {
          return _this3.finished ? undefined : err ? _this3.error(err, _this3.again) : xstat.type !== 'directory' ? _this3.error(new _error2.default.ENOTDIR(), _this3.again) : xstat.uuid !== _this3.uuid ? _this3.error(new _error2.default.EINSTANCE(), _this3.again) : xstat.mtime === _this3.mtime ? _this3.finish(null, _this3.again) : _this3.readXstats(function (err, xstats) {
            return _this3.finished ? undefined : err ? _this3.error(err, _this3.again) : (0, _xstat.readXstat)(_this3.dpath, function (err, xstat2) {
              return _this3.finished ? undefined : err ? _this3.error(err, _this3.again) : xstat2.type !== 'directory' ? _this3.error(new _error2.default.ENOTDIR(), _this3.again) : xstat2.uuid !== _this3.uuid ? _this3.error(new _error2.default.EINSTANCE(), _this3.again) : xstat2.mtime !== xstat.mtime ? _this3.error(new _error2.default.ETIMESTAMP(), _this3.again) : _this3.finish({ mtime: xstat.mtime, xstats: xstats }, _this3.again);
            });
          });
        });
      }, this.delay);
    }
  }, {
    key: 'request',
    value: function request() {
      if (this.finished) throw new Error('probe worker already finished');
      if (this.timer) this.again = true;
    }
  }]);
  return Probe;
}(_worker2.default);

exports.default = function (dpath, uuid, mtime, delay) {
  return new Probe(dpath, uuid, mtime, delay);
};