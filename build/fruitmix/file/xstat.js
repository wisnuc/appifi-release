'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fileMagic = exports.parseMagic = exports.forceFileXattrAsync = exports.forceDriveXstatAsync = exports.forceDriveXstat = exports.updateFileAsync = exports.updateFile = exports.updateFileHashAsync = exports.updateFileHash = exports.readXstatAsync = exports.readXstat = exports.readTimeStamp = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _async = require('../lib/async');

var _async2 = _interopRequireDefault(_async);

var _types = require('../lib/types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isNonNullObject = function isNonNullObject(obj) {
  return (typeof obj === 'undefined' ? 'undefined' : (0, _typeof3.default)(obj)) === 'object' && obj !== null;
};

// constants
var FRUITMIX = 'user.fruitmix';

// bump version when more file type supported
var UNINTERESTED_MAGIC_VERSION = 0;

var parseMagic = function parseMagic(text) {
  return text.startsWith('JPEG image data') ? 'JPEG' : UNINTERESTED_MAGIC_VERSION;
};

var isMagicUpToDate = function isMagicUpToDate(magic) {
  return (0, _isInteger2.default)(magic) && magic >= UNINTERESTED_MAGIC_VERSION || magic === 'JPEG';
};

// it's fast, child.exec is sufficient
var fileMagic = function fileMagic(target, callback) {
  return _child_process2.default.exec('file -b ' + target, function (err, stdout, stderr) {
    return err ? callback(err) : callback(null, parseMagic(stdout.toString()));
  });
};

var fileMagicAsync = (0, _bluebird.promisify)(fileMagic);

var readTimeStamp = function readTimeStamp(target, callback) {
  return _fs2.default.lstat(target, function (err, stats) {
    return err ? callback(err) : callback(null, stats.mtime.getTime());
  });
};

// async version of readXstat, simpler to implement than callback version
var readXstatAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(target, raw) {
    var dirty, attr, stats, name, xstat;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dirty = false, attr = void 0;

            // if this throws, target may be invalid

            _context.next = 3;
            return (0, _bluebird.resolve)(_fs2.default.lstatAsync(target));

          case 3:
            stats = _context.sent;

            if (!(!stats.isDirectory() && !stats.isFile())) {
              _context.next = 6;
              break;
            }

            throw new _error2.default.ENOTDIRFILE();

          case 6:
            _context.prev = 6;
            _context.t0 = JSON;
            _context.next = 10;
            return (0, _bluebird.resolve)(_fsXattr2.default.getAsync(target, FRUITMIX));

          case 10:
            _context.t1 = _context.sent;
            attr = _context.t0.parse.call(_context.t0, _context.t1);
            _context.next = 18;
            break;

          case 14:
            _context.prev = 14;
            _context.t2 = _context['catch'](6);

            if (!(_context.t2.code !== 'ENODATA' && !(_context.t2 instanceof SyntaxError))) {
              _context.next = 18;
              break;
            }

            throw _context.t2;

          case 18:
            if (!attr) {
              _context.next = 30;
              break;
            }

            // validate uuid
            if (!(0, _types.isUUID)(attr.uuid)) {
              dirty = true;
              attr.uuid = _nodeUuid2.default.v4();
            }

            // validate hash and magic

            if (!stats.isFile()) {
              _context.next = 27;
              break;
            }

            if (attr.hasOwnProperty('hash') || attr.hasOwnProperty('htime')) {
              if (!(0, _types.isSHA256)(attr.hash) || !(0, _isInteger2.default)(attr.htime) // is timestamp
              || attr.htime !== stats.mtime.getTime()) {
                dirty = true;
                delete attr.hash;
                delete attr.htime;
              }
            }

            if (isMagicUpToDate(attr.magic)) {
              _context.next = 27;
              break;
            }

            dirty = true;
            _context.next = 26;
            return (0, _bluebird.resolve)(fileMagicAsync(target));

          case 26:
            attr.magic = _context.sent;

          case 27:

            // remove old data TODO remove this code after a few months
            if (attr.hasOwnProperty('owner') || attr.hasOwnProperty('writelist') || attr.hasOwnProperty('readlist')) {
              dirty = true;
              delete attr.owner;
              delete attr.writelist;
              delete attr.readlist;
            }
            _context.next = 36;
            break;

          case 30:
            dirty = true;
            attr = { uuid: _nodeUuid2.default.v4() };

            if (!stats.isFile()) {
              _context.next = 36;
              break;
            }

            _context.next = 35;
            return (0, _bluebird.resolve)(fileMagicAsync(target));

          case 35:
            attr.magic = _context.sent;

          case 36:
            if (!dirty) {
              _context.next = 39;
              break;
            }

            _context.next = 39;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(target, FRUITMIX, (0, _stringify2.default)(attr)));

          case 39:
            if (!raw) {
              _context.next = 41;
              break;
            }

            return _context.abrupt('return', { stats: stats, attr: attr });

          case 41:
            name = _path2.default.basename(target);
            xstat = void 0;

            if (stats.isDirectory()) {
              xstat = {
                uuid: attr.uuid,
                type: 'directory',
                name: name,
                mtime: stats.mtime.getTime()
              };
            } else if (stats.isFile()) {
              xstat = {
                uuid: attr.uuid,
                type: 'file',
                name: name,
                mtime: stats.mtime.getTime(),
                size: stats.size,
                magic: attr.magic
              };
              if (attr.hash) xstat.hash = attr.hash;
            }

            return _context.abrupt('return', xstat);

          case 45:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[6, 14]]);
  }));

  return function readXstatAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var updateFileHashAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(target, uuid, hash, htime) {
    var _ref3, stats, attr, attr2, attr3;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (!(!(0, _types.isSHA256)(hash) || !(0, _isInteger2.default)(htime))) {
              _context2.next = 2;
              break;
            }

            throw new _error2.default.EINVAL();

          case 2:
            _context2.next = 4;
            return (0, _bluebird.resolve)(readXstatAsync(target, true));

          case 4:
            _ref3 = _context2.sent;
            stats = _ref3.stats;
            attr = _ref3.attr;

            if (stats.isFile()) {
              _context2.next = 9;
              break;
            }

            throw new _error2.default.ENOTFILE();

          case 9:
            if (!(uuid !== attr.uuid)) {
              _context2.next = 11;
              break;
            }

            throw new _error2.default.EINSTANCE();

          case 11:
            if (!(htime !== stats.mtime.getTime())) {
              _context2.next = 13;
              break;
            }

            throw new _error2.default.ETIMESTAMP();

          case 13:
            attr2 = { uuid: attr.uuid, hash: hash, htime: htime, magic: attr.magic };
            _context2.next = 16;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(target, FRUITMIX, (0, _stringify2.default)(attr2)));

          case 16:
            _context2.next = 18;
            return (0, _bluebird.resolve)(_fsXattr2.default.getAsync(target, FRUITMIX));

          case 18:
            attr3 = _context2.sent;
            return _context2.abrupt('return', {
              uuid: uuid,
              type: 'file',
              name: _path2.default.basename(target),
              mtime: stats.mtime.getTime(),
              size: stats.size,
              magic: attr2.magic,
              hash: hash
            });

          case 20:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function updateFileHashAsync(_x3, _x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  };
}();

var updateFileAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(target, source, hash) {
    var htime, _ref5, stats, attr, attr2, stats2;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            htime = void 0;
            _context3.next = 3;
            return (0, _bluebird.resolve)(readXstatAsync(target, true));

          case 3:
            _ref5 = _context3.sent;
            stats = _ref5.stats;
            attr = _ref5.attr;
            attr2 = { uuid: attr.uuid };

            if (!hash) {
              _context3.next = 13;
              break;
            }

            _context3.next = 10;
            return (0, _bluebird.resolve)(_fs2.default.lstatAsync(source));

          case 10:
            stats2 = _context3.sent;

            attr2.hash = hash;
            attr2.htime = stats2.mtime.getTime();

          case 13:
            _context3.next = 15;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(source, FRUITMIX, (0, _stringify2.default)(attr2)));

          case 15:
            _context3.next = 17;
            return (0, _bluebird.resolve)(_fs2.default.renameAsync(source, target));

          case 17:
            _context3.next = 19;
            return (0, _bluebird.resolve)(readXstatAsync(target, false));

          case 19:
            return _context3.abrupt('return', _context3.sent);

          case 20:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function updateFileAsync(_x7, _x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

// props may have uuid and/or hash
// if no uuid, a new uuid is generated
var forceFileXattrAsync = function () {
  var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(target, props) {
    var magic, uuid, attr, stats;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _bluebird.resolve)(fileMagicAsync(target));

          case 2:
            magic = _context4.sent;
            uuid = props.uuid || _nodeUuid2.default.v4();
            attr = { uuid: uuid, magic: magic };

            if (!props.hash) {
              _context4.next = 11;
              break;
            }

            _context4.next = 8;
            return (0, _bluebird.resolve)(_fs2.default.statAsync(target));

          case 8:
            stats = _context4.sent;

            attr.hash = props.hash;
            attr.htime = stats.mtime.getTime();

          case 11:
            _context4.next = 13;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(target, FRUITMIX, (0, _stringify2.default)(attr)));

          case 13:
            return _context4.abrupt('return', _context4.sent);

          case 14:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function forceFileXattrAsync(_x10, _x11) {
    return _ref6.apply(this, arguments);
  };
}();

// this function is used when init drive
var forceDriveXstatAsync = function () {
  var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(target, driveUUID) {
    var attr;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            attr = { uuid: driveUUID };
            _context5.next = 3;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(target, FRUITMIX, (0, _stringify2.default)(attr)));

          case 3:
            _context5.next = 5;
            return (0, _bluebird.resolve)(readXstatAsync(target, false));

          case 5:
            return _context5.abrupt('return', _context5.sent);

          case 6:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function forceDriveXstatAsync(_x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}();

var readXstat = function readXstat(target, callback) {
  return readXstatAsync(target, false).asCallback(callback);
};

var updateFileHash = function updateFileHash(target, uuid, hash, htime, callback) {
  return updateFileHashAsync(target, uuid, hash, htime).asCallback(callback);
};

var updateFile = function updateFile(target, source, hash, callback) {
  if (typeof hash === 'function') {
    callback = hash;
    hash = undefined;
  }
  updateFileAsync(target, source, hash).asCallback(callback);
};

var forceDriveXstat = function forceDriveXstat(target, driveUUID, callback) {
  return forceDriveXstatAsync(target, driveUUID).asCallback(callback);
};

exports.readTimeStamp = readTimeStamp;
exports.readXstat = readXstat;
exports.readXstatAsync = readXstatAsync;
exports.updateFileHash = updateFileHash;
exports.updateFileHashAsync = updateFileHashAsync;
exports.updateFile = updateFile;
exports.updateFileAsync = updateFileAsync;
exports.forceDriveXstat = forceDriveXstat;
exports.forceDriveXstatAsync = forceDriveXstatAsync;
exports.forceFileXattrAsync = forceFileXattrAsync;
exports.parseMagic = parseMagic;
exports.fileMagic = fileMagic;