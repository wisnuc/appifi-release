'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFirstUser = exports.createUserModel = exports.createUserModelAsync = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _throw = require('../util/throw');

var _collection = require('./collection');

var _reducers = require('../../reducers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:userModel');

// import bcrypt from 'bcryptjs'


(0, _bluebird.promisifyAll)(_fs2.default);

var isUUID = function isUUID(x) {
  return typeof x === 'string' && _validator2.default.isUUID(x);
};

var md4Encrypt = function md4Encrypt(text) {
  return _crypto2.default.createHash('md4').update(Buffer.from(text, 'utf16le')).digest('hex').toUpperCase();
};

/** Schema
{

*   type: // string, 'local' or 'remote'

    uuid: { type: String, unique: true, required: true },
*   username: { type: String, unique: true, required: true },
x   password: { type: String, required: true },
x   smbPassword:
x   smbLastChangeTime:

o   avatar: { type: String, required: true },
o   email: { type: String, unique: true },

o1  isAdmin: { type: Boolean },
    isFirstUser: { type: Boolean },

    home: // home drive uuid (auto generated when creating)
    library: // library drive uuid (auto generated when creating)
}

Note: 
o1  neglected for first user 

**/

/** Schema Patch
{

x   type: // string, 'local' or 'remote'

x   uuid: { type: String, unique: true, required: true },
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
x   smbPassword:
x   smbLastChangeTime:

    avatar: { type: String, required: true },
    email: { type: String, unique: true },

o1  isAdmin: { type: Boolean },
    isFirstUser: { type: Boolean },

x   home: // home drive uuid (auto generated when creating)
x   library: // library drive uuid (auto generated when creating)
}

Note: 
o1  can only be changed by first user

**/

(0, _bluebird.promisifyAll)(_bcrypt2.default);

// TODO
var validateAvatar = function validateAvatar(avatar) {
  return true;
};

var UserModel = function (_EventEmitter) {
  (0, _inherits3.default)(UserModel, _EventEmitter);

  function UserModel(collection) {
    (0, _classCallCheck3.default)(this, UserModel);

    var _this = (0, _possibleConstructorReturn3.default)(this, (UserModel.__proto__ || (0, _getPrototypeOf2.default)(UserModel)).call(this));

    _this.collection = collection;
    _this.increment = 2000;
    _this.eset = new _set2.default();
    _this.hash = _nodeUuid2.default.v4();

    _this.collection.list.forEach(function (user) {
      if (user.type === 'local') _this.eset.add(user.unixUID);
    });
    return _this;
  }

  (0, _createClass3.default)(UserModel, [{
    key: 'allocUnixUID',
    value: function allocUnixUID() {
      while (this.eset.has(this.increment)) {
        this.increment++;
      }return this.increment++;
    }
  }, {
    key: 'createUser',
    value: function createUser(props, callback) {
      var _this2 = this;

      var einval = function einval(text) {
        return process.nextTick(callback, (0, _assign2.default)(new Error(text), { code: 'EINVAL' }));
      };
      var ebusy = function ebusy(text) {
        return process.nextTick(callback, (0, _assign2.default)(new Error(text), { code: 'EBUSY' }));
      };

      var list = this.collection.list;
      var type = props.type,
          username = props.username,
          password = props.password,
          avatar = props.avatar,
          email = props.email,
          isAdmin = props.isAdmin;


      if (type !== 'local' && type !== 'remote') return einval('invalid user type');
      if (typeof username !== 'string' || !username.length || list.find(function (u) {
        return u.username === username;
      })) return einval('invalid username');
      if (typeof password !== 'string' || !password.length) return einval('invalid password');

      if (avatar && (typeof avatar !== 'string' || avatar.length === 0)) return einval('invalid avatar');

      avatar = avatar || null;

      if (email && (typeof email !== 'string' || !_validator2.default.isEmail(email))) return einval('invalid email');

      email = email || null;

      if (isAdmin && typeof isAdmin !== 'boolean') return einval('invalid isAdmin, must be true or false');

      isAdmin = isAdmin || false;

      var uuid = _nodeUuid2.default.v4();
      var salt = _bcrypt2.default.genSaltSync(10);
      var passwordEncrypted = _bcrypt2.default.hashSync(password, salt);
      var smbPasswordEncrypted = md4Encrypt(password);
      var lastChangeTime = new Date().getTime();

      if (this.collection.locked) return ebusy('locked');

      var isFirstUser = list.length === 0 ? true : false;
      if (isFirstUser) isAdmin = true;

      var newUser = {
        type: type,
        uuid: _nodeUuid2.default.v4(),
        username: username,
        password: passwordEncrypted,
        smbPassword: smbPasswordEncrypted,
        lastChangeTime: lastChangeTime,
        avatar: avatar,
        email: email,
        isAdmin: isAdmin,
        isFirstUser: isFirstUser,
        home: _nodeUuid2.default.v4(),
        library: _nodeUuid2.default.v4()
      };

      if (newUser.type === 'local') newUser.unixUID = this.allocUnixUID();

      this.collection.updateAsync(list, [].concat((0, _toConsumableArray3.default)(list), [newUser])).asCallback(function (err) {
        if (err) return callback(err);
        callback(null, newUser);
        (0, _reducers.storeDispatch)({
          type: 'UPDATE_FRUITMIX_USERS',
          data: _this2.collection.list
        });
      });
    }
  }, {
    key: 'updateUser',
    value: function updateUser(userUUID, props, callback) {
      var _this3 = this;

      var einval = function einval(text) {
        return process.nextTick(callback, (0, _assign2.default)(new Error(text), { code: 'EINVAL' }));
      };
      var enoent = function enoent(text) {
        return process.nextTick(callback, (0, _assign2.default)(new Error(text), { code: 'ENOENT' }));
      };

      var list = this.collection.list;
      var user = list.find(function (u) {
        return u.uuid === userUUID;
      });
      if (!user) return enoent('user not found');

      // only following field are allowed 
      // username
      // password
      // avatar
      // email

      var username = props.username,
          password = props.password,
          smbUsername = props.smbUsername,
          smbPassword = props.smbPassword,
          avatar = props.avatar,
          email = props.email;


      var change = {};

      // username
      if (username) {
        if (typeof username !== 'string' || !username.length || list.filter(function (u) {
          return u.uuid !== userUUID;
        }).find(function (other) {
          return other.username === username;
        })) return einval('invalid username');
        change.username = username;
        change.lastChangeTime = new Date().getTime();
      }

      // password
      if (password) {
        if (password !== 'string' || !password.length) return einval('invalid password');
        change.password = _bcrypt2.default.hashSync(password, _bcrypt2.default.genSaltSync(10));
        change.smbPassword = md4Encrypt(password);
        change.lastChangeTime = new Date().getTime();
      }

      // avatar
      if (avatar === undefined) {} else if (avatar === null) change.avatar = null;else if (typeof avatar === 'string' && !avatar.length) change.avatar = avatar;else return einval('invalid avatar');

      // email 
      if (email === undefined) {} else if (email === null) change.email = null;else if (typeof email === 'string' && !email.length) change.email = email;else return einval('invalid email');

      // merge
      var update = (0, _assign2.default)({}, user, change);
      var index = list.findIndex(function (u) {
        return u.uuid === userUUID;
      });

      this.collection.updateAsync(list, [].concat((0, _toConsumableArray3.default)(list.slice(0, index)), [update], (0, _toConsumableArray3.default)(list.slice(index + 1)))).asCallback(function (err) {
        if (err) return callback(err);
        callback(null, update);
        (0, _reducers.storeDispatch)({
          type: 'UPDATE_FRUITMIX_USERS',
          data: _this3.collection.list
        });
      });
    }

    // to be refactored

  }, {
    key: 'deleteUser',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(uuid) {
        var user;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                if (typeof uuid !== 'string') (0, _throw.throwInvalid)('invalid uuid');
                if (this.collection.locked) (0, _throw.throwBusy)();

                user = this.collection.list.find(function (u) {
                  return u.uuid === uuid;
                });

                if (user) {
                  _context.next = 5;
                  break;
                }

                throw (0, _assign2.default)(new Error('delete user: uuid ' + uuid + ' not found'), { code: 'ENOENT' });

              case 5:
                _context.next = 7;
                return this.collection.updateAsync(this.collection.list, this.collection.list.filter(function (u) {
                  return u !== user;
                }));

              case 7:

                this.emit('userDeleted', user);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function deleteUser(_x) {
        return _ref.apply(this, arguments);
      }

      return deleteUser;
    }()

    // 

  }, {
    key: 'verifyPassword',
    value: function verifyPassword(useruuid, password, callback) {

      var user = this.collection.list.find(function (u) {
        return u.uuid === useruuid;
      });
      if (!user) return process.nextTick(function () {
        return callback(null, null);
      });

      _bcrypt2.default.compare(password, user.password, function (err, match) {
        if (err) return callback(err);
        match ? callback(null, user) : callback(null, null);
      });
    }
  }]);
  return UserModel;
}(_events2.default);

var createUserModel = function createUserModel(filepath, tmpdir, callback) {
  return createUserModelAsync(filepath, tmpdir).asCallback(function (err, result) {
    return callback(err, result);
  });
};

var createUserModelAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(filepath, tmpfolder) {
    var collection, _ret;

    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _collection.openOrCreateCollectionAsync)(filepath, tmpfolder);

          case 2:
            collection = _context3.sent;

            if (!collection) {
              _context3.next = 8;
              break;
            }

            return _context3.delegateYield(_regenerator2.default.mark(function _callee2() {
              var list, locals, eset, uarr, count, alloc;
              return _regenerator2.default.wrap(function _callee2$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      list = collection.list;
                      locals = list.filter(function (user) {
                        return user.type === 'local';
                      });
                      eset = new _set2.default(); // store uid

                      uarr = []; // store user to be processed, no unixUID or duplicate/out-of-range uid 

                      locals.forEach(function (user) {

                        // invalid
                        if (!(0, _isInteger2.default)(user.unixUID)) uarr.push(user);
                        // out-of-range
                        if (user.unixUID < 2000 || user.unixUID >= 10000) uarr.push(user);
                        // existing 
                        if (eset.has(user.unixUID)) uarr.push(user);

                        eset.add(user.unixUID);
                      });

                      count = 2000;

                      alloc = function alloc() {
                        while (eset.has(count)) {
                          count++;
                        }return count;
                      };

                      uarr.forEach(function (user) {
                        return user.unixUID = alloc();
                      });

                      debug('user list', list);
                      _context2.next = 11;
                      return collection.updateAsync(list, list);

                    case 11:

                      (0, _reducers.storeDispatch)({
                        type: 'UPDATE_FRUITMIX_USERS',
                        data: collection.list
                      });
                      return _context2.abrupt('return', {
                        v: new UserModel(collection)
                      });

                    case 13:
                    case 'end':
                      return _context2.stop();
                  }
                }
              }, _callee2, undefined);
            })(), 't0', 5);

          case 5:
            _ret = _context3.t0;

            if (!((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object")) {
              _context3.next = 8;
              break;
            }

            return _context3.abrupt('return', _ret.v);

          case 8:
            return _context3.abrupt('return', null);

          case 9:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function createUserModelAsync(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

// external use
var createFirstUser = function createFirstUser(mp, username, password, callback) {

  var salt = _bcrypt2.default.genSaltSync(10);
  var encrypted = _bcrypt2.default.hashSync(password, salt);
  var md4 = md4Encrypt(password);

  var users = [{
    type: 'local',
    uuid: _nodeUuid2.default.v4(),
    username: username,
    password: encrypted,
    smbPassword: md4,
    lastChangeTime: new Date().getTime(),
    avatar: null,
    email: null,
    isAdmin: true,
    isFirstUser: true,
    home: _nodeUuid2.default.v4(),
    library: _nodeUuid2.default.v4(),
    unixUID: 2000
  }];

  debug('creating first user', users[0]);

  var dir = _path2.default.join(mp, 'wisnuc', 'fruitmix', 'models');
  (0, _mkdirp2.default)(dir, function (err) {

    if (err) return callback(err);
    _fs2.default.writeFile(_path2.default.join(dir, 'users.json'), (0, _stringify2.default)(users, null, '  '), function (err) {

      err ? callback(err) : callback(null, users[0]);
    });
  });
};

exports.createUserModelAsync = createUserModelAsync;
exports.createUserModel = createUserModel;
exports.createFirstUser = createFirstUser;