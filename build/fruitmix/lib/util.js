'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.writeFileToDisk = exports.mapXstatToObject = exports.fs = exports.mkdirpAsync = exports.rimrafAsync = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rimrafAsync = exports.rimrafAsync = _bluebird2.default.promisify(_rimraf2.default);
var mkdirpAsync = exports.mkdirpAsync = _bluebird2.default.promisify(_mkdirp2.default);

_bluebird2.default.promisifyAll(_fs2.default);

exports.fs = _fs2.default;
var mapXstatToObject = exports.mapXstatToObject = function mapXstatToObject(xstat) {

  /* example xstat, xstat instanceof fs.stat
  { dev: 2049,
    mode: 16893,
    nlink: 2,
    uid: 1000,
    gid: 1000,
    rdev: 0,
    blksize: 4096,
    ino: 135577,
    size: 4096,
    blocks: 16,
    atime: 2016-06-27T06:36:58.382Z,
    mtime: 2016-06-27T06:36:58.382Z,
    ctime: 2016-06-27T06:36:58.382Z,
    birthtime: 2016-06-27T06:36:58.382Z,
    uuid: '0924c387-f1c6-4a35-a5db-ae4b7568d5de',
    owner: [ '061a954c-c52a-4aa2-8702-7bc84c72ec84' ],
    writelist: [ '9e7b40bf-f931-4292-8870-9e62b9d5a12c' ],
    readlist: [ 'b7ed9abc-01d3-41f0-80eb-361498025e56' ],
    hash: null,
    abspath: '/home/xenial/Projects/fruitmix/tmptest' } */

  var name = _path2.default.basename(xstat.abspath);

  if (xstat.isDirectory()) {

    return {
      uuid: xstat.uuid,
      type: 'folder',
      owner: xstat.owner,
      writelist: xstat.writelist,
      readlist: xstat.readlist,
      name: name
    };
  } else if (xstat.isFile()) {

    return {
      uuid: xstat.uuid,
      type: 'file',
      owner: xstat.owner,
      writelist: xstat.writelist,
      readlist: xstat.readlist,
      name: name,
      mtime: xstat.mtime.getTime(),
      size: xstat.size,
      hash: xstat.hash,
      magic: xstat.magic
    };
  }

  throw new Error('mapXstatToObject: only folder and file supported');
};

var writeFileToDisk = exports.writeFileToDisk = function writeFileToDisk(fpath, data, callback) {

  var error = void 0,
      os = _fs2.default.createWriteStream(fpath);

  os.on('error', function (err) {
    error = err;
    callback(err);
  });

  // TODO may be changed to finish ???
  os.on('close', function () {
    if (!error) callback(null);
  });

  os.write(data);
  os.end();
};