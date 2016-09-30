'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testing = exports.copyXattrAsync = exports.copyXattr = exports.updateXattrHashMagic = exports.updateXattrHash = exports.updateXattrPermission = exports.updateXattrOwner = exports.readXstatAsync = exports.readXstat = exports.readTimeStamp = undefined;

var _bluebird = require('bluebird');

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _shallowequal = require('shallowequal');

var _shallowequal2 = _interopRequireDefault(_shallowequal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
  uuid:
  owner:
  writelist:
  readlist:
  hash:
  magic:
  htime:
**/

// constant
var FRUITMIX = 'user.fruitmix';

var parseJSON = function parseJSON(string) {
  try {
    return JSON.parse(string);
  } catch (e) {
    return null;
  }
};

var EInvalid = function EInvalid(text) {
  return (0, _assign2.default)(new Error(text || 'invalid args'), { code: 'EINVAL' });
};

var InstanceMismatch = function InstanceMismatch(text) {
  return (0, _assign2.default)(new Error(text || 'instance mismatch'), { code: 'EINSTANCEMISMATCH' });
};

var TimestampMismatch = function TimestampMismatch(text) {
  return (0, _assign2.default)(new Error(text || 'timestamp mismatch'), { code: 'ETIMESTAMPMISMATCH' });
};

var readTimeStamp = function readTimeStamp(target, callback) {
  return _fs2.default.lstat(target, function (err, stats) {
    return err ? callback(err) : callback(null, stats.mtime.getTime());
  });
};

// test uuid, return true or false, accept undefined
var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' ? _validator2.default.isUUID(uuid) : false;
};

// validate uuid, if invalid, return new
var validateUUID = function validateUUID(uuid) {
  return isUUID(uuid) ? uuid : _nodeUuid2.default.v4();
};

// validate uuid array, if array, filter out invalid, if not array, return undefined
// this function returns original if valid, for shallowequal comparison
var validateUserList = function validateUserList(list) {
  if (!Array.isArray(list)) return undefined; // undefined
  return list.every(isUUID) ? list : list.filter(isUUID);
};

var validateOwner = function validateOwner(owner) {
  var val = validateUserList(owner);
  if (val === undefined) return [];
  return val;
};

// validate hash
// const isHashValid = (hash, htime, mtime) => htime === mtime && /[a-f0-9]{64}/.test(hash)
var isHashValid = function isHashValid(hash) {
  return (/[a-f0-9]{64}/.test(hash)
  );
};

// validate Xattr
var validateXattr = function validateXattr(attr, type, mtime) {

  attr.uuid = validateUUID(attr.uuid);
  // attr.owner = validateUserList(attr.owner)
  attr.owner = validateOwner(attr.owner);
  attr.writelist = validateUserList(attr.writelist);
  attr.readlist = validateUserList(attr.readlist);

  if (!attr.writelist && attr.readlist) attr.writelist = [];
  if (!attr.readlist && attr.writelist) attr.readlist = [];

  switch (type) {
    case 'file':
      if (!(0, _isInteger2.default)(mtime)) throw new Error('mtime must be an integer');
      if (attr.hasOwnProperty('hash') || attr.hasOwnProperty('htime')) {
        if (!isHashValid(attr.hash) || attr.htime !== mtime) {
          if (attr.hasOwnProperty('hash')) delete attr.hash;
          if (attr.hasOwnProperty('magic')) delete attr.magic; // TODO workaround solution
          if (attr.hasOwnProperty('htime')) delete attr.htime;
        }
      }
      break;

    case 'folder':
      if (attr.hasOwnProperty('hash')) delete attr.hash;
      if (attr.hasOwnProperty('htime')) delete attr.htime;
      break;

    default:
      throw new Error('invalid type');
  }
  return attr;
};

// opts determines if there is no xattr or xattr is not valid JSON
//
//    null: function returns null, xattr won't be set
//    object: this object will be used as xattr, it's owner, writelist, readlist must all be uuid array (empty is fine)
//    not provided: using default
//
// const readXstat = (target, opts, callback) =>
// const readXstat = (target, callback) =>
// well - formatted

var readXstat = function readXstat(target) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  var opts = args.length === 2 ? args.shift() : undefined;
  var callback = args.shift();

  if (opts !== undefined && (typeof opts === 'undefined' ? 'undefined' : (0, _typeof3.default)(opts)) !== 'object') return process.nextTick(callback, new TypeError('opts invalid'));

  // now opts is either null or object
  if (opts) {
    // not null
    if (opts.owner && opts.owner === validateUserList(opts.owner) && (opts.writelist && opts.writelist === validateUserList(opts.writelist) && opts.readlist && opts.readlist === validateUserList(opts.readlist) || opts.writelist === undefined && opts.readlist === undefined)) {} else return process.nextTick(callback, new TypeError('opts invalid'));
  }

  var parsed = void 0,
      valid = void 0;
  _fs2.default.lstat(target, function (err, stats) {

    if (err) return callback(err);
    if (!(stats.isDirectory() || stats.isFile())) return callback(new Error('not a folder or file'));
    if (!stats.isDirectory() && opts && (opts.writelist || opts.readlist)) return callback(new Error('not a folder (opts)'));

    _fsXattr2.default.get(target, FRUITMIX, function (err, attr) {

      if (err && err.code !== 'ENODATA') return callback(err);
      if (!err) parsed = parseJSON(attr);
      if (err || !parsed) {
        // ENODATA or JSON invalid

        if (opts === null) return callback(null, null);
        if (opts === undefined) opts = { uuid: _nodeUuid2.default.v4(), owner: [] };else opts.uuid = _nodeUuid2.default.v4();

        return _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(opts), function (err) {
          return err ? callback(err) : callback(null, (0, _assign2.default)(stats, opts, { abspath: target }));
        });
      }

      var type = void 0,
          copy = (0, _assign2.default)({}, parsed);
      if (stats.isDirectory()) type = 'folder';else if (stats.isFile()) type = 'file';else throw new Error('unexpected type');

      valid = validateXattr(parsed, type, stats.mtime.getTime());
      if (!(0, _shallowequal2.default)(valid, copy)) _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(valid), function (err) {
        return err ? callback(err) : callback(null, (0, _assign2.default)(stats, valid, { abspath: target }));
      });else callback(null, (0, _assign2.default)(stats, valid, { abspath: target }));
    }); // xattr.get
  });
};

var updateXattrOwner = function updateXattrOwner(target, uuid, owner, callback) {

  readXstat(target, function (err, xstat) {
    if (err) return callback(err);
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());
    var writelist = xstat.writelist;
    var readlist = xstat.readlist;
    var hash = xstat.hash;
    var htime = xstat.htime;

    var newAttr = { uuid: uuid, owner: owner, writelist: writelist, readlist: readlist, hash: hash, htime: htime };
    _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(newAttr), function (err) {
      return err ? callback(err) : callback(null, (0, _assign2.default)(xstat, { owner: owner }));
    });
  });
};

var updateXattrPermission = function updateXattrPermission(target, uuid, writelist, readlist, callback) {

  readXstat(target, function (err, xstat) {
    if (err) return callback(err);
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());
    var owner = xstat.owner;
    var hash = xstat.hash;
    var magic = xstat.magic;
    var htime = xstat.htime;

    var newAttr = { uuid: uuid, owner: owner, writelist: writelist, readlist: readlist, hash: hash, magic: magic, htime: htime };
    _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(newAttr), function (err) {
      return err ? callback(err) : callback(null, (0, _assign2.default)(xstat, { writelist: writelist, readlist: readlist }));
    });
  });
};

var updateXattrHash = function updateXattrHash(target, uuid, hash, htime, callback) {

  readXstat(target, function (err, xstat) {
    if (err) return callback(err);
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());
    var owner = xstat.owner;
    var writelist = xstat.writelist;
    var readlist = xstat.readlist;

    var newAttr = { uuid: uuid, owner: owner, writelist: writelist, readlist: readlist, hash: hash, htime: htime };
    _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(newAttr), function (err) {
      return err ? callback(err) : callback(null, (0, _assign2.default)(xstat, { hash: hash, htime: htime }));
    });
  });
};

var updateXattrHashMagic = function updateXattrHashMagic(target, uuid, hash, magic, htime, callback) {

  readXstat(target, function (err, xstat) {
    if (err) return callback(err);

    // uuid mismatch
    if (xstat.uuid !== uuid) return callback(InstanceMismatch());
    // invalid hash or magic
    if (!isHashValid(hash) || typeof magic !== 'string' || magic.length === 0) return callback(EInvalid());
    // timestamp mismatch
    if (xstat.mtime.getTime() !== htime) return callback(TimestampMismatch());

    var owner = xstat.owner;
    var writelist = xstat.writelist;
    var readlist = xstat.readlist;

    var newXattr = { uuid: xstat.uuid, owner: owner, writelist: writelist, readlist: readlist, hash: hash, magic: magic, htime: htime };
    _fsXattr2.default.set(target, FRUITMIX, (0, _stringify2.default)(newXattr), function (err) {
      err ? callback(err) : callback(null, (0, _assign2.default)(xstat, { hash: hash, magic: magic, htime: htime, abspath: target }));
    });
  });
};

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

var readXstatAsync = (0, _bluebird.promisify)(readXstat);
var copyXattrAsync = (0, _bluebird.promisify)(copyXattr);

var testing = {};

exports.readTimeStamp = readTimeStamp;
exports.readXstat = readXstat;
exports.readXstatAsync = readXstatAsync;
exports.updateXattrOwner = updateXattrOwner;
exports.updateXattrPermission = updateXattrPermission;
exports.updateXattrHash = updateXattrHash;
exports.updateXattrHashMagic = updateXattrHashMagic;
exports.copyXattr = copyXattr;
exports.copyXattrAsync = copyXattrAsync;
exports.testing = testing;