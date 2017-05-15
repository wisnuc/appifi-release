'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.librariesMigration = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _const = require('./const');

var _model = require('../cluster/model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var validator = require('validator');

var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' ? validator.isUUID(uuid) : false;
};

var librariesMigration = function librariesMigration(filedata, callback) {
  (0, _model.localUsers)(function (e, users) {
    var userLibraries = users.filter(function (user) {
      return user.library === 'string' && user.library;
    }).map(function (user) {
      return user.library;
    });
    var count = userLibraries.length;
    userLibraries.forEach(function (library) {
      return libraryMigration(filedata.findNodeByUUID(library), function () {
        count--;
        if (count == 0) return callback();
      });
    });
  });
};

var libraryMigration = function libraryMigration(libraryNode, callback) {
  if (!libraryNode) return;
  if (!(libraryNode.children instanceof Array)) return;
  var libraryPath = libraryNode.absPath();
  libraryNode.children.forEach(function (deviceUUID) {
    if (!isUUID(deviceUUID)) return;
    var devicePath = _path2.default.join(libraryPath, deviceUUID);
    _fs2.default.readdir(devicePath, function (err, files) {
      if (err) return _fs2.default.rmdir(devicePath, function (err) {
        return callback();
      });

      // if(files.length === 0) FIXME

      var count = files.length;

      var done = function done() {
        count--;
        if (count == 0) return _fs2.default.rmdir(devicePath, function (err) {
          return callback();
        });
      };

      files.forEach(function (file) {
        // src is in tmp folder
        var dirpath = _path2.default.join(libraryPath, file.slice(0, 2));
        var filepath = _path2.default.join(dirpath, file.slice(2));

        (0, _mkdirp2.default)(dirpath, function (err) {
          // create head dir
          if (err) return done();
          _fs2.default.rename(tmppath, filepath, function (err) {
            // TODO  if error  Jack
            return done();
          });
        });
      });
    });
  });
};

exports.librariesMigration = librariesMigration;