'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var child = require('child_process');

module.exports = function (target, uuid, callback) {

  var hash = null,
      magic = null,
      timestamp = void 0,
      finished = false;
  var file = void 0,
      openssl = void 0;
  var count = 2;

  fs.stat(target, function (err, stats) {

    if (finished) return;
    if (err) return CALLBACK(err);
    if (!stats.isFile()) return einval('must be a file');

    timestamp = stats.mtime.getTime();

    openssl = child.spawn('openssl', ['dgst', '-sha256', '-r', target]);
    openssl.stdout.on('data', function (data) {
      return hash = data.toString().trim().slice(0, 64);
    });
    openssl.on('close', function (code) {
      openssl = null;
      if (code !== 0) hash = null;
      if (!finished) END();
    });

    file = child.spawn('file', ['-b', target]);
    file.stdout.on('data', function (data) {
      return magic = data.toString().trim();
    });
    file.on('close', function (code) {
      file = null;
      if (code !== 0) magic = null;
      if (!finished) END();
    });
  });

  return function () {
    if (finished) return;
    if (openssl) openssl.kill();
    if (file) file.kill();
    finished = true;
  };

  function CALLBACK(err, res) {
    finished = true;
    callback(err, res);
  }

  function einval(text) {
    CALLBACK((0, _assign2.default)(new Error(text)), { code: 'EINVAL' });
  }

  function END() {
    if (finished) return;
    if (! --count) CALLBACK(null, {
      target: target,
      uuid: uuid,
      hash: hash,
      magic: magic,
      timestamp: timestamp
    });
  }
};