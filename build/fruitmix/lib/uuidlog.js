'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createUUIDLog = function createUUIDLog(dirpath) {

  var dir = dirpath;

  return {
    append: function append(uuid, data, callback) {

      var text = data.split('\n')[0].trim();
      if (text.length === 0) return process.nextTick(callback, null);

      var abort = false;
      var os = _fs2.default.createWriteStream(_path2.default.join(dir, uuid), { flags: 'a' });
      os.on('error', function (error) {
        if (abort) return;
        abort = true;
        callback(error);
      });

      os.on('close', function () {
        if (abort) return;
        callback(null);
      });
      os.write('\n');
      os.write(text);
      os.end();
    },
    get: function get(uuid, callback) {

      var arr = [];
      var abort = false;

      var input = _fs2.default.createReadStream(_path2.default.join(dir, uuid));
      input.on('error', function (err) {
        if (abort) return;
        abort = true;
        err.code === 'ENOENT' ? callback(null, []) : callback(err);
      });

      var rl = _readline2.default.createInterface({ input: input });

      rl.on('error', function (err) {
        if (abort) return;
        abort = true;
        callback(err);
      });

      rl.on('line', function (line) {
        if (abort) return;
        if (line.trim().length) arr.push(line.trim());
      });

      rl.on('close', function () {
        if (abort) return;
        callback(null, arr);
      });
    }
  };
};

exports.default = createUUIDLog;