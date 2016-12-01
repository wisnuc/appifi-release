'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeObjectAsync = exports.rimraf = exports.mkdirp = exports.xattr = exports.child = exports.fs = exports.rimrafAsync = exports.mkdirpAsync = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _bluebird.promisifyAll)(_fs2.default);
(0, _bluebird.promisifyAll)(_child_process2.default);
(0, _bluebird.promisifyAll)(_fsXattr2.default);

var mkdirpAsync = exports.mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
var rimrafAsync = exports.rimrafAsync = (0, _bluebird.promisify)(_rimraf2.default);

exports.fs = _fs2.default;
exports.child = _child_process2.default;
exports.xattr = _fsXattr2.default;
exports.mkdirp = _mkdirp2.default;
exports.rimraf = _rimraf2.default;


var writeObject = function writeObject(target, tmpdir, obj, callback) {

  var buf = void 0,
      err = void 0,
      os = void 0,
      tmp = void 0;

  try {
    buf = (0, _stringify2.default)(obj, null, '  ');
  } catch (e) {
    process.nextTick(function () {
      return callback(e);
    });
    return;
  }

  var tmpPath = _path2.default.join(tmpdir, _nodeUuid2.default.v4());
  os = _fs2.default.createWriteStream(tmpPath);
  os.on('error', function (e) {
    return callback(err = e);
  });
  os.on('close', function () {
    return err || _fs2.default.rename(tmpPath, target, function (err) {
      return callback(err);
    });
  });
  os.write(buf);
  os.end();
};

var writeObjectAsync = exports.writeObjectAsync = (0, _bluebird.promisify)(writeObject);