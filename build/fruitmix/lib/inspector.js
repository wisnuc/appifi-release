'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// only inspect a folder
// ENOTDIR

// ENOENT
// EMISMATCH

// const EMISMATCH = 'EMISMATCH'

var ERROR = function ERROR(code, _text) {
  return function (cb, text) {
    return cb((0, _assign2.default)(new Error(text || _text), { code: code }));
  };
};

var ENOTDIR = ERROR('ENOTDIR', 'not a directory');
var EMISMATCH = ERROR('EMISMATCH', 'uuid mismatch');
var EAGAIN = ERROR('EAGAIN', 'try again');

var inspect = function inspect(target, uuid, callback) {

  var error = function error(text, code) {
    return callback((0, _assign2.default)(new Error(text), { code: code }));
  };
  var _abort = false;

  readXstat(target, function (err, xstat) {

    if (_abort) return;
    if (xstat.uuid !== uuid) return EMISMATCH(callback);
    if (!xstat.isDirectory()) return ENOTDIR(callback);

    var timestamp = xstat.mtime.getTime();

    // possible errors unknown, EBADF seems not relevant to NodeJS
    // ENOENT is a possible error
    _fs2.default.readdir(target, function (err, entries) {

      if (_abort) return;
      if (err) return callback(err);

      var count = entries.length;
      var xstats = [];
      entries.forEach(function (entry) {
        readXstat(_path2.default.join(target, entry), function (err, xstat) {
          if (_abort) return;
          if (!err) xstats.push(xstat); // bypass error
          if (! --count) finalize();
        });
      });
    });

    function finalize() {

      readXstat(target, function (err, xstat2) {

        if (_abort) return;
        if (err) return callback(err);
        if (xstat2.uuid !== uuid) return EMISMATCH(callback);
        if (!xstat2.isDirectory()) return ENOTDIR(callback);
        if (xstat2.mtime.getTime() !== timestamp) return error('timestamp changed during operation', EAGAIN);

        callback(null, { timestamp: timestamp, xstats: xstats });
      });
    }
  });

  return (0, _freeze2.default)({
    uuid: uuid,
    abort: function abort() {
      _abort = true;
    }
  });
};

exports.default = inspect;