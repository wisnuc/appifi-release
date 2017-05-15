'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.probeFruitmix = exports.initFruitmix = exports.md4Encrypt = undefined;

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:tools');

(0, _bluebird.promisifyAll)(_fs2.default);
var mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
var rimrafAsync = (0, _bluebird.promisify)(_rimraf2.default);

/**
 * Functions in this file are supposed to be used 'statically'.
 *
 * Don't import any dependencies from fruitmix code.
 */

/**
 * Calculate md4 for given text, used for samba password generation or verification
 *
 * @param { string } plain text, empty string is OK
 */
var md4Encrypt = function md4Encrypt(text) {
  return _crypto2.default.createHash('md4').update(Buffer.from(text, 'utf16le')).digest('hex').toUpperCase();
};

/**
 * This function prepares folder/file structure before init fruitmix
 *
 * for wisnuc and fruitmix, if exist, if remove is specified, they are removed, except for /wisnuc
 * if they exist and are not folders, and remove is not specified, throw error
 *
 * for models (as well as files inside it), it is NEVER removed, there is no remove option for it.
 * if it exists, it is rename to something like models-20170107T035048588Z, which is models- suffixed
 * with and iso format data string stripped '-', ':', and '.'
 *
 * after preparation, the folder should be
 * (mp)/ no wisnuc, or
 * (mp)/wisnuc no fruitmix, or
 * (mp)/wisnuc/fruitmix no models
 */
var prepareAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(mp, remove) {
    var wisnuc, fruitmix, models, stats, archive;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (_path2.default.isAbsolute(mp)) {
              _context.next = 2;
              break;
            }

            throw (0, _assign2.default)(new Error('requires absolute path as mountpoint'), { code: 'EINVAL' });

          case 2:
            wisnuc = _path2.default.join(mp, 'wisnuc');
            fruitmix = _path2.default.join(wisnuc, 'fruitmix');
            models = _path2.default.join(fruitmix, 'models');
            stats = void 0;
            _context.prev = 6;
            _context.next = 9;
            return (0, _bluebird.resolve)(_fs2.default.lstatAsync(wisnuc));

          case 9:
            stats = _context.sent;
            _context.next = 17;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](6);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 16;
              break;
            }

            return _context.abrupt('return');

          case 16:
            throw _context.t0;

          case 17:
            if (stats.isDirectory()) {
              _context.next = 25;
              break;
            }

            if (!(remove !== 'wisnuc')) {
              _context.next = 20;
              break;
            }

            throw new Error('wisnuc exists and is not a directory');

          case 20:
            _context.next = 22;
            return (0, _bluebird.resolve)(rimrafAsync(wisnuc));

          case 22:
            return _context.abrupt('return');

          case 25:
            if (!(remove === 'wisnuc')) {
              _context.next = 31;
              break;
            }

            if (!(mp === '/')) {
              _context.next = 28;
              break;
            }

            throw new Error('wisnuc on root fs cannot be removed. wisnuc system (not user data) is installed here.');

          case 28:
            _context.next = 30;
            return (0, _bluebird.resolve)(rimrafAsync(wisnuc));

          case 30:
            return _context.abrupt('return');

          case 31:
            _context.prev = 31;
            _context.next = 34;
            return (0, _bluebird.resolve)(_fs2.default.lstatAsync(fruitmix));

          case 34:
            stats = _context.sent;
            _context.next = 42;
            break;

          case 37:
            _context.prev = 37;
            _context.t1 = _context['catch'](31);

            if (!(_context.t1.code === 'ENOENT')) {
              _context.next = 41;
              break;
            }

            return _context.abrupt('return');

          case 41:
            throw _context.t1;

          case 42:
            if (stats.isDirectory()) {
              _context.next = 50;
              break;
            }

            if (!(remove !== 'fruitmix')) {
              _context.next = 45;
              break;
            }

            throw new Error('fruitmix exists and is not a directory');

          case 45:
            _context.next = 47;
            return (0, _bluebird.resolve)(rimrafAsync(fruitmix));

          case 47:
            return _context.abrupt('return');

          case 50:
            if (!(remove === 'fruitmix')) {
              _context.next = 54;
              break;
            }

            _context.next = 53;
            return (0, _bluebird.resolve)(rimrafAsync(fruitmix));

          case 53:
            return _context.abrupt('return');

          case 54:
            _context.prev = 54;
            _context.next = 57;
            return (0, _bluebird.resolve)(_fs2.default.lstatAsync(models));

          case 57:
            stats = _context.sent;
            _context.next = 65;
            break;

          case 60:
            _context.prev = 60;
            _context.t2 = _context['catch'](54);

            if (!(_context.t2.code === 'ENOENT')) {
              _context.next = 64;
              break;
            }

            return _context.abrupt('return');

          case 64:
            throw _context.t2;

          case 65:

            // models exists
            archive = _path2.default.join(fruitmix, 'models-' + new Date().toISOString().replace(/(-|:|\.)/g, ''));
            _context.next = 68;
            return (0, _bluebird.resolve)(_fs2.default.renameAsync(models, archive));

          case 68:
            return _context.abrupt('return');

          case 69:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[6, 12], [31, 37], [54, 60]]);
  }));

  return function prepareAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * Initialize fruitmix in an out-of-band way. Directly write users/drive files to disk.
 * 
 * 1. create wisnuc, fruitmix, models and drives path
 * 2. generate uuids for home and library
 * 3, create home folder and library folder
 * 4. create drives.json model file
 * 5. create users.json model file
 */
var initFruitmixAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(_ref3) {
    var mp = _ref3.mp,
        username = _ref3.username,
        password = _ref3.password,
        remove = _ref3.remove;
    var modelsPath, drivesPath, uuid, home, library, drives, drivesFile, salt, encrypted, md4, users, usersFile;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _bluebird.resolve)(prepareAsync(mp, remove));

          case 2:

            console.log('[fruitmix-tools] init fruitmix', mp, username);

            // mkdirp
            modelsPath = _path2.default.join(mp, 'wisnuc', 'fruitmix', 'models');
            _context2.next = 6;
            return (0, _bluebird.resolve)(mkdirpAsync(modelsPath));

          case 6:

            // mkdirp
            drivesPath = _path2.default.join(mp, 'wisnuc', 'fruitmix', 'drives');
            _context2.next = 9;
            return (0, _bluebird.resolve)(mkdirpAsync(drivesPath));

          case 9:

            // mkdirp
            uuid = _nodeUuid2.default.v4();
            home = _nodeUuid2.default.v4();
            library = _nodeUuid2.default.v4();
            _context2.next = 14;
            return (0, _bluebird.resolve)(mkdirpAsync(_path2.default.join(drivesPath, home)));

          case 14:
            _context2.next = 16;
            return (0, _bluebird.resolve)(mkdirpAsync(_path2.default.join(drivesPath, library)));

          case 16:

            // create drives model
            drives = [{
              label: username + '-drive',
              fixedOwner: true,
              URI: 'fruitmix',
              uuid: home,
              owner: [uuid],
              writelist: [],
              readlist: [],
              cache: true
            }, {
              label: username + '-library',
              fixedOwner: true,
              URI: 'fruitmix',
              uuid: library,
              owner: [uuid],
              writelist: [],
              readlist: [],
              cache: true
            }];

            // create drive model file

            drivesFile = _path2.default.join(modelsPath, 'drives.json');
            _context2.next = 20;
            return (0, _bluebird.resolve)(_fs2.default.writeFileAsync(drivesFile, (0, _stringify2.default)(drives, null, '  ')));

          case 20:

            // create users model
            salt = _bcrypt2.default.genSaltSync(10);
            encrypted = _bcrypt2.default.hashSync(password, salt);
            md4 = md4Encrypt(password);
            users = [{
              type: 'local',
              uuid: uuid,
              username: username,
              password: encrypted,
              smbPassword: md4,
              lastChangeTime: new Date().getTime(),
              avatar: null,
              email: null,
              isAdmin: true,
              isFirstUser: true,
              home: home,
              library: library,
              unixUID: 2000
            }];
            usersFile = _path2.default.join(modelsPath, 'users.json');
            _context2.next = 27;
            return (0, _bluebird.resolve)(_fs2.default.writeFileAsync(usersFile, (0, _stringify2.default)(users, null, '  ')));

          case 27:
            return _context2.abrupt('return', {
              type: 'local',
              uuid: uuid,
              username: username,
              avatar: null,
              email: null,
              isAdmin: true,
              isFirstUser: true,
              home: home,
              library: library,
              unixUID: 2000
            });

          case 28:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function initFruitmixAsync(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var initFruitmix = function initFruitmix(args, callback) {
  return initFruitmixAsync(args).asCallback(callback);
};

/**
 * This function probe fruitmix system as well as its users.
 *
 * all operational errors are return as first arguments in callback. It is up to the caller how to deal
 * with the error message, non-operational errors are returned as data props.
 *

    {
      users: [...]
    }
    
    for:
      wisnuc/fruitmix/models/users.json exists, valid

    or 
    
      {
        error: {
          code: string (may not provided if error from api) 
        }
      }

      ENOWISNUC         // wisnuc folder does not exist
      EWISNUCNOTDIR     // wisnuc folder is not a dir
      ENOFRUITMIX       // fruitmix folder does not exist
      EFRUITMIXNOTDIR   // fruitmix folder is not a dir
      ENOMODELS         // models folder does not exist
      EMODELSNOTDIR     // models folder is not a dir
      ENOUSERS          // users.json file does not exist
      EUSERSNOTFILE     // users.json is not a file
      EUSERSPARSE       // users.json parse fail
      EUSERSFORMAT      // users.json is not well formatted


 * @param {string} mountpoint - must be a valid absolute path. 
 *                              It is considered to be the parent folder for 'wisnuc'
 */
var probeFruitmix = function probeFruitmix(mountpoint, callback) {

  var cb = function cb(users, error) {

    // NOTFOUND
    // AMBIGUOUS
    // DAMAGED
    // READY
    var status = users ? 'READY' : ['ENOWISNUC', 'EWISNUCNOTDIR', 'ENOFRUITMIX', 'EFRUITMIXNOTDIR'].includes(error) ? 'NOTFOUND' : ['ENOMODELS', 'EMODELSNOTDIR', 'ENOUSERS', 'EUSERSNOTFILE'].includes(error) ? 'AMBIGUOUS' : ['EUSERSPARSE', 'EUSERSFORMAT'].includes(error) ? 'DAMAGED' : null;

    var mmap = new _map2.default([['ENOWISNUC', '/wisnuc文件夹不存在'], ['EWISNUCNOTDIR', '/wisnuc路径存在但不是文件夹'], ['ENOFRUITMIX', '/wisnuc文件夹存在但没有/wisnuc/fruitmix文件夹'], ['EFRUITMIXNOTDIR', '/wisnuc/fruitmix路径存在但不是文件夹'], ['ENOMODELS', '/wisnuc/fruitmix路径存在但/wisnuc/fruitmix/models文件夹不存在'], ['EMODELSNOTDIR', '/wisnuc/fruitmix/models路径存在但不是文件夹'], ['ENOUSERS', '/wisnuc/fruitmix/models文件夹存在但users.json文件不存在'], ['EUSERSNOTFILE', '/wisnuc/fruitmix/models/users.json路径存在但users.json不是文件'], ['EUSERSPARSE', '/wisnuc/fruitmix/models/users.json文件存在但不是合法的JSON格式'], ['EUSERSFORMAT', '/wisnuc/fruitmix/models/users.json文件存在但格式不正确']]);

    var message = error ? mmap.get(error) : null;

    var intact = error === 'ENOWISNUC' || mountpoint === '/' && 'ENOFRUITMIX';

    callback(null, { status: status, users: users, error: error, message: message, intact: intact });
  };

  if (!_path2.default.isAbsolute(mountpoint)) return process.nextTick(function () {
    return callback((0, _assign2.default)(new Error('requires an absolute path'), { code: 'EINVAL' }));
  });

  var wisnuc = _path2.default.join(mountpoint, 'wisnuc');
  _fs2.default.lstat(wisnuc, function (err, stats) {
    if (err && err.code === 'ENOENT') return cb(null, 'ENOWISNUC');
    if (err) return callback(err);

    if (!stats.isDirectory()) return cb(null, 'EWISNUCNOTDIR');

    var fruit = _path2.default.join(wisnuc, 'fruitmix');
    _fs2.default.lstat(fruit, function (err, stats) {

      if (err && err.code === 'ENOENT') return cb(null, 'ENOFRUITMIX');
      if (err) return callback(err);
      if (!stats.isDirectory()) return cb(null, 'EFRUITMIXNOTDIR');

      var modelsDir = _path2.default.join(fruit, 'models');
      _fs2.default.lstat(modelsDir, function (err, stats) {

        if (err && err.code === 'ENOENT') return cb(null, 'ENOMODELS');
        if (err) return callback(err);
        if (!stats.isDirectory()) return cb(null, 'EMODELSNOTDIR');

        var fpath = _path2.default.join(modelsDir, 'users.json');
        _fs2.default.lstat(fpath, function (err, stats) {

          if (err && err.code === 'ENOENT') return cb(null, 'ENOUSERS');
          if (err) return callback(err);
          if (!stats.isFile()) return cb(null, 'EUSERSNOTFILE');

          _fs2.default.readFile(fpath, function (err, data) {

            debug('users.json readfile', err || data);

            if (err) return callback(err);

            var users = void 0;
            try {
              users = JSON.parse(data.toString());
            } catch (e) {
              return cb(null, 'EUSERSPARSE');
            }

            if (!Array.isArray(users)) return cb(null, 'EUSERSFORMAT');

            users.forEach(function (user) {
              delete user.password;
              delete user.smbPassword;
              delete user.lastChangeTime;
            });

            return cb(users, null);
          });
        });
      });
    });
  });
};

exports.md4Encrypt = md4Encrypt;
exports.initFruitmix = initFruitmix;
exports.probeFruitmix = probeFruitmix;