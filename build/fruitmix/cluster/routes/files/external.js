'use strict';

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = (0, _bluebird.promisifyAll)(require('fs'));
var router = require('express').Router();
var validator = require('validator');
var UUID = require('node-uuid');
var sanitize = require("sanitize-filename");
var mkdirpAsync = (0, _bluebird.promisify)(require('mkdirp'));
var rimrafAsync = (0, _bluebird.promisify)(require('rimraf'));

/**

mkdir or upload
POST /external/[appifi|fs]/:uuid/path/to/directory
PUT  /external/[appifi|fs]/:uuid/path/to/file

rename
{ name: 'newfilename' }
PATCH /external/[appifi|fs]/:uuid/path/to/directory/or/file

delete
DELETE /external/[appifi|fs]/:uuid/path/to/directory/or/file

**/

var isUUID = function isUUID(text) {
  return typeof text === 'string' && validator.isUUID(text);
};
var isNormalizedPath = function isNormalizedPath(rpath) {
  return typeof rpath === 'string' && path.normalize(rpath) === rpath;
};
var isSanitizedName = function isSanitizedName(name) {
  return typeof name === 'string' && sanitize(name) === name;
};

var rootPathAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(type, uuid) {
    var storage, blocks, volumes, fileSystems, target;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(type !== 'fs')) {
              _context.next = 2;
              break;
            }

            throw new Error('type not supported, yet');

          case 2:
            _context.t0 = JSON;
            _context.next = 5;
            return (0, _bluebird.resolve)(fs.readFileAsync('/run/wisnuc/storage'));

          case 5:
            _context.t1 = _context.sent;
            storage = _context.t0.parse.call(_context.t0, _context.t1);
            blocks = storage.blocks, volumes = storage.volumes;

            if (!(!Array.isArray(blocks) || !Array.isArray(volumes))) {
              _context.next = 10;
              break;
            }

            throw new Error('bad storage format');

          case 10:

            /** TODO this function should be in sync with extractFileSystem in boot.js **/
            fileSystems = [].concat((0, _toConsumableArray3.default)(blocks.filter(function (blk) {
              return blk.isFileSystem && !blk.isVolumeDevice && blk.isMounted;
            })), (0, _toConsumableArray3.default)(volumes.filter(function (vol) {
              return vol.isFileSystem && !vol.isMissing && vol.isMounted;
            })));

            if (uuid) {
              _context.next = 13;
              break;
            }

            return _context.abrupt('return', fileSystems);

          case 13:
            target = fileSystems.find(function (fsys) {
              return fsys.fileSystemUUID === uuid;
            });

            if (target) {
              _context.next = 16;
              break;
            }

            throw new Error('not found');

          case 16:
            return _context.abrupt('return', target.mountpoint);

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function rootPathAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var tmpFile = function tmpFile() {
  if (config.path) return path.join(config.path, 'tmp');
  throw new Error();
};

// relpath empty is OK
var readdirOrDownloadAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(type, uuid, relpath) {
    var rootpath, abspath, stats, entries, statEntryAsync;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            console.log(type === 'fs');
            console.log(isUUID(uuid));
            console.log(relpath.length === 0 || isNormalizedPath(relpath));
            console.log(relpath);

            if (!(type === 'fs'
            // && isUUID(uuid)
            && (relpath.length === 0 || isNormalizedPath(relpath)))) {
              _context3.next = 7;
              break;
            }

            _context3.next = 8;
            break;

          case 7:
            throw new Error('invalid arguments');

          case 8:
            _context3.next = 10;
            return (0, _bluebird.resolve)(rootPathAsync(type, uuid));

          case 10:
            rootpath = _context3.sent;
            abspath = path.join(rootpath, relpath);
            _context3.next = 14;
            return (0, _bluebird.resolve)(fs.lstatAsync(abspath));

          case 14:
            stats = _context3.sent;

            if (!stats.isDirectory()) {
              _context3.next = 25;
              break;
            }

            _context3.next = 18;
            return (0, _bluebird.resolve)(fs.readdirAsync(abspath));

          case 18:
            entries = _context3.sent;

            statEntryAsync = function () {
              var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(entry) {
                var s;
                return _regenerator2.default.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.prev = 0;
                        _context2.next = 3;
                        return (0, _bluebird.resolve)(fs.lstatAsync(path.join(abspath, entry)));

                      case 3:
                        s = _context2.sent;

                        if (!s.isDirectory()) {
                          _context2.next = 8;
                          break;
                        }

                        return _context2.abrupt('return', { type: 'directory', name: entry, size: s.size, mtime: s.mtime.getTime() });

                      case 8:
                        if (!s.isFile()) {
                          _context2.next = 12;
                          break;
                        }

                        return _context2.abrupt('return', { type: 'file', name: entry, size: s.size, mtime: s.mtime.getTime() });

                      case 12:
                        return _context2.abrupt('return', { type: 'unsupported', name: entry });

                      case 13:
                        _context2.next = 18;
                        break;

                      case 15:
                        _context2.prev = 15;
                        _context2.t0 = _context2['catch'](0);
                        return _context2.abrupt('return', null);

                      case 18:
                      case 'end':
                        return _context2.stop();
                    }
                  }
                }, _callee2, undefined, [[0, 15]]);
              }));

              return function statEntryAsync(_x6) {
                return _ref3.apply(this, arguments);
              };
            }();

            _context3.next = 22;
            return (0, _bluebird.resolve)((0, _bluebird.all)(entries.map(function (entry) {
              return statEntryAsync(entry);
            })).filter(function (r) {
              return r !== null;
            }));

          case 22:
            return _context3.abrupt('return', _context3.sent);

          case 25:
            if (!stats.isFile()) {
              _context3.next = 27;
              break;
            }

            return _context3.abrupt('return', abspath);

          case 27:
            throw new Error('unsupported file type');

          case 28:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function readdirOrDownloadAsync(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

// mkdirp is OK
var mkdirAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(type, uuid, relpath) {
    var rootpath, abspath;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(type === 'fs' && isUUID(uuid) && typeof relpath === 'string' && isNormalizedPath(relpath))) {
              _context4.next = 3;
              break;
            }

            _context4.next = 4;
            break;

          case 3:
            throw new Error('invalid arguments');

          case 4:
            _context4.next = 6;
            return (0, _bluebird.resolve)(rootPathAsync(type, uuid));

          case 6:
            rootpath = _context4.sent;
            abspath = path.join(rootpath, relpath);
            _context4.next = 10;
            return (0, _bluebird.resolve)(mkdirpAsync(abspath));

          case 10:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function mkdirAsync(_x7, _x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

// return path
var uploadAsync = function () {
  var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(type, uuid, relpath) {
    var rootpath, abspath;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(type === 'fs' && isUUID(uuid) && typeof relpath === 'string' && isNormalizedPath(relpath))) {
              _context5.next = 3;
              break;
            }

            _context5.next = 4;
            break;

          case 3:
            throw new Error('invalid arguments');

          case 4:
            _context5.next = 6;
            return (0, _bluebird.resolve)(rootPathAsync(type, uuid));

          case 6:
            rootpath = _context5.sent;
            abspath = path.join(rootpath, relpath);
            _context5.prev = 8;
            _context5.next = 11;
            return (0, _bluebird.resolve)(fs.lstatAsync(abspath));

          case 11:
            throw new Error('already exists');

          case 14:
            _context5.prev = 14;
            _context5.t0 = _context5['catch'](8);

            if (!(_context5.t0.code !== 'ENOENT')) {
              _context5.next = 18;
              break;
            }

            throw _context5.t0;

          case 18:
            return _context5.abrupt('return', abspath);

          case 19:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined, [[8, 14]]);
  }));

  return function uploadAsync(_x10, _x11, _x12) {
    return _ref5.apply(this, arguments);
  };
}();

// basename => name 
var renameAsync = function () {
  var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(type, uuid, relpath, name) {
    var rootpath, oldpath, newpath;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (!(type === 'fs' && isUUID(uuid) && typeof relpath === 'string' && isNormalizedPath(relpath) && isSanitizedName(name))) {
              _context6.next = 3;
              break;
            }

            _context6.next = 4;
            break;

          case 3:
            throw new Error('invalid arguments');

          case 4:
            _context6.next = 6;
            return (0, _bluebird.resolve)(rootPathAsync(type, uuid));

          case 6:
            rootpath = _context6.sent;
            oldpath = path.join(rootpath, relpath);
            newpath = path.join(path.dirname(oldpath), name);
            _context6.next = 11;
            return (0, _bluebird.resolve)(fs.rename(oldpath, newpath));

          case 11:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  }));

  return function renameAsync(_x13, _x14, _x15, _x16) {
    return _ref6.apply(this, arguments);
  };
}();

// rimraf is OK
var deleteAsync = function () {
  var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7(type, uuid, relpath) {
    var rootpath, abspath;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (!(type === 'fs' && isUUID(uuid) && typeof relpath === 'string' && isNormalizedPath(relpath))) {
              _context7.next = 3;
              break;
            }

            _context7.next = 4;
            break;

          case 3:
            throw new Error('invalid arguments');

          case 4:
            _context7.next = 6;
            return (0, _bluebird.resolve)(rootPathAsync(type, uuid));

          case 6:
            rootpath = _context7.sent;
            abspath = path.join(rootpath, relpath);
            _context7.next = 10;
            return (0, _bluebird.resolve)(rimrafAsync(abspath));

          case 10:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  }));

  return function deleteAsync(_x17, _x18, _x19) {
    return _ref7.apply(this, arguments);
  };
}();

router.get('/fs', function (req, res) {
  return rootPathAsync('fs').then(function (fileSystems) {
    return res.status(200).json(fileSystems);
  }).catch(function (e) {
    return e.code === 'EINVAL' ? res.status(400).json({ code: 'EINVAL', message: e.message }) : res.status(400).json({ code: e.code, message: e.message });
  });
});

/**
list or download
GET /external/[appifi|fs]/:uuid/path/to/directory/or/file
**/
router.get('/:type/:uuid/*', function (req, res) {
  return readdirOrDownloadAsync(req.params.type, req.params.uuid, req.params[0]).then(function (data) {
    return res.status(200).json(data);
  }).catch(function (e) {
    return e.code === 'EINVAL' ? res.status(400).json({ code: 'EINVAL', message: e.message }) : res.status(500).json({ code: e.code, message: e.message });
  });
});

/**
mkdir
POST /external/[appifi|fs]/:uuid/path/to/directory
**/
router.post('/:type/:uuid/*', function (req, res) {
  return mkdirAsync(req.params.type, req.params.uuid, req.params[0]).then(function () {
    return res.status(200).json({ message: 'ok' });
  }).catch(function (e) {
    return e.code === 'EINVAL' ? res.status(400).json({ code: 'EINVAL', message: e.message }) : res.status(500).json({ code: e.code, message: e.message });
  });
});

/**
upload
PUT 
**/
router.put('/:type/:uuid/*', function (req, res) {
  return uploadAsync(req.params.type, req.params.uuid, req.params[0]).then(function (abspath) {
    var finished = false;
    var stream = fs.createWriteStream(abspath);
    stream.on('error', function (err) {
      if (finished) return;
      res.status(500).json({ code: err.code, message: err.message });
      finished = true;
    });
    stream.on('close', function () {
      if (finished) return;
      res.status(200).json({ message: 'ok' });
      finished = true;
    });
    req.pipe(stream);
  }).catch(function (e) {
    return e.code === 'EINVAL' ? res.status(400).json({ code: 'EINVAL', message: e.message }) : res.status(500).json({ code: e.code, message: e.message });
  });
});

/**
rename
{ name: 'newfilename' }
PATCH /external/[appifi|fs]/:uuid/path/to/directory/or/file
**/
router.patch('/:type/:uuid/*', function (req, res) {
  return renameAsync(req.params.type, req.params.uuid, req.params[0], req.body.name).then(function () {
    return res.status(200).json({ message: 'ok' });
  }).catch(function (e) {
    return e.code === 'EINVAL' ? res.status(400).json({ code: 'EINVAL', message: e.message }) : res.status(500).json({ code: e.code, message: e.message });
  });
});

/**
delete
DELETE /external/[appifi|fs]/:uuid/path/to/directory/or/file
**/
router.delete('/:type/:uuid/*', function (req, res) {
  return deleteAsync(req.params.type, req.params.uuid, req.params[0], req.body.name).then(function () {
    return res.status(200).json({ message: 'ok' });
  }).catch(function (e) {
    return e.code === 'EINVAL' ? res.status(400).json({ code: 'EINVAL', message: e.message }) : res.status(500).json({ code: e.code, message: e.message });
  });
});

module.exports = router;