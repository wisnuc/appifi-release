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

var _xstat = require('./xstat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// we do not use state machine pattern and event emitter for performance sake
// the probe is essentially the same as originally designed stm, it just cut the transition from
// probing to waiting or idle. 
// exiting probing is considered an end. If 'again` is required, the caller should create another
// probe in callback.

// prober may return
// error
// {
//    mtime: timestamp for given directory
//    props: props for entries
//    again: should do it again
// }
var probe = function probe(dpath, uuid, mtime, delay, callback) {

  var timer = void 0,
      again = false,
      aborted = false;

  // embedded function, to avoid callback branch
  var readProps = function readProps(callback) {
    return _fs2.default.readdir(dpath, function (err, entries) {
      if (aborted) return;
      if (err) return callback(err);
      if (entries.length === 0) return callback(null, []);

      var props = [];
      var count = entries.length;

      entries.forEach(function (ent) {
        return (0, _xstat.readXstat)(_path2.default.join(dpath, ent), function (err, xstat) {
          if (aborted) return;
          if (!err) props.push(xstat); // FIXME
          if (! --count) callback(null, props.sort(function (a, b) {
            return a.name.localeCompare(b.name);
          }));
        });
      });
    });
  };

  timer = setTimeout(function () {
    (0, _xstat.readXstat)(dpath, function (err, xstat) {
      if (aborted) return;
      if (err) return callback(err);
      if (!xstat.type === 'directory') return callback(new _error2.default.ENOTDIR());
      if (xstat.uuid !== uuid) return callback(new _error2.default.EINSTANCE());
      if (xstat.mtime === mtime) {
        console.log('probe: same timestamp, arg: ' + mtime + ', readback: ' + xstat.mtime);
        return callback(null, { data: null, again: again });
      }

      // read props
      readProps(function (err, xstats) {
        if (aborted) return;
        if (err) callback(err);

        // read second time
        (0, _xstat.readXstat)(dpath, function (err, xstat2) {
          if (aborted) return;
          if (err) return callback(err);
          if (!xstat2.type === 'directory') return callback(new _error2.default.ENOTDIR());
          if (xstat2.uuid !== uuid) return callback(new _error2.default.EINSTANCE());
          if (xstat2.mtime !== xstat.mtime) return callback(new _error2.default.ETIMESTAMP());

          var data = { mtime: xstat.mtime, xstats: xstats };
          callback(null, { data: data, again: again });
        });
      });
    });
  }, delay);

  return {

    type: 'probe',
    abort: function abort() {
      aborted = true;
      callback(new _error2.default.EABORT());
    },
    request: function request() {
      if (timer) return;
      again = true;
    }
  };
};

exports.default = probe;

var probeWorker = function (_EventEmitter) {
  (0, _inherits3.default)(probeWorker, _EventEmitter);

  function probeWorker() {
    (0, _classCallCheck3.default)(this, probeWorker);

    var _this = (0, _possibleConstructorReturn3.default)(this, (probeWorker.__proto__ || (0, _getPrototypeOf2.default)(probeWorker)).call(this));

    _this.type = 'probe';

    _this.dpath = dpath;
    _this.uuid = uuid;
    _this.mtime = mtime;
    _this.delay = delay;

    // state
    _this.finished = false;
    _this.timer = null;

    // relay
    _this.again = false;
    return _this;
  }

  (0, _createClass3.default)(probeWorker, [{
    key: 'readXstats',
    value: function readXstats(callback) {
      var _this2 = this;

      _fs2.default.readdir(this.dpath, function (err, entries) {
        if (_this2.finished) return;
        if (err) return callback(err);
        if (entries.length === 0) return callback(null, []);

        var xstats = [];
        var count = entries.length;
        entries.forEach(function (ent) {
          return (0, _xstat.readXstat)(_path2.default.join(_this2.dpath, ent), function (err, xstat) {
            if (_this2.finished) return;
            if (!err) xstats.push(xstat);
            if (! --count) {
              xstats.sort(function (a, b) {
                return a.name.localeCompare(b.name);
              });
              callback(null, xstats);
            }
          });
        });
      });
    }
  }, {
    key: 'probe',
    value: function probe() {
      this.timer = setTimeout(function () {}, this.deay);
    }
  }, {
    key: 'request',
    value: function request() {
      if (this.timer) return;
      again = true;
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.finished = true;
    }
  }]);
  return probeWorker;
}(EventEmitter);