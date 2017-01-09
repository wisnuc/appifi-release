'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testing = exports.copyXattr = exports.updateXattrHash = exports.updateXattrPermission = exports.readXstatAsync = exports.readXstat = exports.readTimeStamp = undefined;

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _bluebird.psomisifyAll)(_fs2.default);
(0, _bluebird.promisifyAll)(_fsXattr2.default);

// constants
var FRUITMIX = 'user.fruitmix';

// bump version when more file type supported
var UNINTERESTED_MAGIC_VERSION = 0;
var parseMagic = function parseMagic(text) {
  return text.startsWith('JPEG image data') ? 'JPEG' : UNINTERESTED_MAGIC_VERSION;
};

var EInvalid = function EInvalid(text) {
  return (0, _assign2.default)(new Error(text || 'invalid args'), { code: 'EINVAL' });
};

var InstanceMismatch = function InstanceMismatch(text) {
  return (0, _assign2.default)(new Error(text || 'instance mismatch'), { code: 'EMISMATCH' });
};

var TimestampMismatch = function TimestampMismatch(text) {
  return (0, _assign2.default)(new Error(text || 'timestamp mismatch'), { code: 'EOUTDATED' });
};

// test uuid, return true or false, accept undefined
var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' ? _validator2.default.isUUID(uuid) : false;
};

// validate hash
var isSHA256 = function isSHA256(hash) {
  return (/[a-f0-9]{64}/.test(hash)
  );
};

// it's fast, child.exec is sufficient
var fileMagic = function fileMagic(target, callback) {
  return _child_process2.default.exec('file -b ' + target, function (err, stdout, stderr) {
    return err ? callback(err) : callback(parseMagic(stdout.toString()));
  });
};

var readTimeStamp = function readTimeStamp(target, callback) {
  return _fs2.default.lstat(target, function (err, stats) {
    return err ? callback(err) : callback(null, stats.mtime.getTime());
  });
};

// this function throw SyntaxError if given attr is bad formatted
var validateOldFormat = function validateOldFormat(attr, isFile) {

  if (typeof attr.uuid === 'string' || _validator2.default.isUUID(attr.uuid)) {} else throw new SyntaxError('invalid uuid');

  if (Array.isArray(attr.owner) && attr.owner.every(function (uuid) {
    return isUUID(uuid);
  })) {} else throw new SyntaxError('invalid owner');

  if (attr.writelist === null || attr.writelist.every(function (uuid) {
    return isUUID(uuid);
  })) {} else throw new SyntaxError('invalid writelist');

  if (attr.readlist === null || attr.readlist.every(function (uuid) {
    return isUUID(uuid);
  })) {} else throw new SyntaxError('invalid readlist');

  if (!!attr.writelist === !!attr.readlist) {} else throw new SyntaxError('writelist and readlist inconsistent');

  if (isFile) {

    if (attr.hasOwnProperty('hash') === attr.hasOwnProperty('htime')) {} else throw new SyntaxError('hash and htime inconsistent');

    if (attr.hasOwnProperty('hash')) {
      if (!isSHA256(attr.hash)) throw new SyntaxError('invalid hash string');

      if (!(0, _isInteger2.default)('htime')) throw new SyntaxError('invalid htime');
    }

    if (attr.hasOwnProperty('magic')) {
      if (typeof magic !== 'string') throw new SyntaxError('invalid magic');
    }
  }
};

var validateNewFormat = function validateNewFormat(attr, isFile) {

  if (typeof attr.uuid === 'string' || _validator2.default.isUUID(attr.uuid)) {} else throw new SyntaxError('invalid uuid');

  if (attr.writelist && attr.writelist.every(function (uuid) {
    return isUUID(uuid);
  })) {} else throw new SyntaxError('invalid writelist');

  if (attr.readlist && attr.readlist.every(function (uuid) {
    return isUUID(uuid);
  })) {} else throw new SyntaxError('invalid readlist');

  if (isFile) {

    if (attr.hasOwnProperty('hash') === attr.hasOwnProperty('htime')) {} else throw new SyntaxError('hash and htime inconsistent');

    if (attr.hasOwnProperty('hash')) {
      if (!isSHA256(attr.hash)) throw new SyntaxError('invalid hash string');

      if (!(0, _isInteger2.default)('htime')) throw new SyntaxError('invalid htime');
    }

    if (attr.hasOwnProperty('magic')) {
      if (typeof magic === 'string' || (0, _isInteger2.default)(attr.magic)) {} else throw new SyntaxError('invalid magic');
    }
  }
};

// async version of readXstat, simpler to implement than callback version
var readXstatAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(target) {
    var dirty, attr, stats;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dirty = false;
            attr = void 0;
            _context.next = 4;
            return _fs2.default.lstatAsync(target);

          case 4:
            stats = _context.sent;

            if (!(!stats.isDirectory() && !stats.isFile())) {
              _context.next = 7;
              break;
            }

            throw (0, _assign2.default)(new Error('not a directory or file'), { code: 'ENOTDIRORFILE' });

          case 7:
            _context.prev = 7;
            _context.t0 = JSON;
            _context.next = 11;
            return _fsXattr2.default.getAsync(target, FRUITMIX);

          case 11:
            _context.t1 = _context.sent;
            attr = _context.t0.parse.call(_context.t0, _context.t1);

            if (!attr.hasOwnProperty('owner')) {
              _context.next = 30;
              break;
            }

            validateOldFormat(attr);

            dirty = true;
            delete attr.owner;
            if (attr.writelist === null) delete attr.writelist;
            if (attr.readlist === null) delete attr.readlist;

            if (!stats.isFile()) {
              _context.next = 28;
              break;
            }

            if (!attr.magic) {
              _context.next = 24;
              break;
            }

            _context.t2 = parseMagic(attr.magic);
            _context.next = 27;
            break;

          case 24:
            _context.next = 26;
            return fileMagicAsync(target);

          case 26:
            _context.t2 = _context.sent;

          case 27:
            attr.magic = _context.t2;

          case 28:
            _context.next = 31;
            break;

          case 30:
            valdiateNewFormat(attr);

          case 31:
            // drop hash if outdated
            if (stats.isFile() && attr.htime && attr.htime !== stats.mtime) {
              dirty = true;
              delete attr.hash;
              delete attr.htime;
            }
            _context.next = 44;
            break;

          case 34:
            _context.prev = 34;
            _context.t3 = _context['catch'](7);

            if (!(_context.t3.code !== 'ENODATA' && !(_context.t3 instanceof SyntaxError))) {
              _context.next = 38;
              break;
            }

            throw _context.t3;

          case 38:

            dirty = true;
            attr = { uuid: _nodeUuid2.default.v4() };

            if (!stats.isFile()) {
              _context.next = 44;
              break;
            }

            _context.next = 43;
            return fileMagicAsync(target);

          case 43:
            attr.magic = _context.sent;

          case 44:
            if (!dirty) {
              _context.next = 47;
              break;
            }

            _context.next = 47;
            return _fsXattr2.default.setAsync(target, FRUITMIX, (0, _stringify2.default)(attr));

          case 47:

            // remove props not passed to caller
            if (stats.isFile() && attr.htime) delete attr.htime;
            if (stats.isFile() && typeof attr.magic === 'number') delete attr.magic;

            return _context.abrupt('return', (0, _assign2.default)(stats, attr, { abspath: target }));

          case 50:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[7, 34]]);
  }));

  return function readXstatAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

var readXstat = function readXstat(target, callback) {
  return readXstatAsync(target).asCallback(callback);
};

// write, readlist (target, uuid, opts, callback)
// opts: {
//    writelist: optional
//    readlist: optional
//  }, null
var updateXattrPermission = function updateXattrPermission(target, uuid, writelist, readlist, callback) {

  if (!isUUID(uuid)) return process.nextTick(function () {
    return callback(EInvalid('invalid uuid'));
  });

  readXstat(target, function (err, xstat) {

    if (err) return callback(err);
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());
    if (!xstat.isDirectory()) return callback((0, _assign2.default)(new Error('not a directory'), { code: 'ENOTDIR' }));

    var newAttr = { uuid: uuid, writelist: writelist, readlist: readlist };
    _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(newAttr), function (err) {
      return err ? callback(err) : callback(null, (0, _assign2.default)(xstat, { writelist: writelist, readlist: readlist }));
    });
  });
};

var updateXattrHash = function updateXattrHash(target, uuid, hash, htime, callback) {

  readXstat(target, function (err, xstat) {
    if (err) return callback(err);
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());

    // uuid mismatch
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());
    // invalid hash or magic
    if (!isSHA256(hash) || typeof magic !== 'string' || magic.length === 0) return callback(EInvalid());
    // timestamp mismatch
    if (xstat.mtime.getTime() !== htime) return callback(TimestampMismatch());

    var writelist = xstat.writelist,
        readlist = xstat.readlist;

    var newAttr = { uuid: uuid, writelist: writelist, readlist: readlist, hash: hash, htime: htime };
    _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(newAttr), function (err) {
      return err ? callback(err) : callback(null, (0, _assign2.default)(xstat, { hash: hash, htime: htime }));
    });
  });
};

// questionable
// fs.rename(oldpath, newpath, ...)
// transfer xattr, translate hash/htime, magic

// a file repository (path, node, uuid...)
// a tmp file, return new xstat
var copyXattr = function copyXattr(dst, src, callback) {

  _fsXattr2.default.get(src, 'user.fruitmix', function (err, attr) {

    // src has not xattr, nothing to copy
    if (err && err.code === 'ENODATA') return callback(null);
    if (err) return callback(err);

    _fsXattr2.default.set(dst, 'user.fruitmix', attr, function (err) {
      return err ? callback(err) : callback(null);
    });
  });
};

// const readXstatAsync = Promise.promisify(readXstat)
var copyXattrAsync = (0, _bluebird.promisify)(copyXattr);

var testing = {};

exports.readTimeStamp = readTimeStamp;
exports.readXstat = readXstat;
exports.readXstatAsync = readXstatAsync;
exports.updateXattrPermission = updateXattrPermission;
exports.updateXattrHash = updateXattrHash;
exports.copyXattr = copyXattr;
exports.testing = testing;