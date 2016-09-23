'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createUserModel = exports.createUserModelAsync = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _bcryptjs = require('bcryptjs');

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _throw = require('../util/throw');

var _collection = require('./collection');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

(0, _bluebird.promisifyAll)(_bcryptjs2.default);

// TODO
var validateAvatar = function validateAvatar(avatar) {
  return true;
};

var UserModel = function (_EventEmitter) {
  (0, _inherits3.default)(UserModel, _EventEmitter);

  function UserModel(collection) {
    (0, _classCallCheck3.default)(this, UserModel);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(UserModel).call(this));

    _this.collection = collection;
    _this.hash = _nodeUuid2.default.v4();
    return _this;
  }

  (0, _createClass3.default)(UserModel, [{
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
      var type = props.type;
      var username = props.username;
      var password = props.password;
      var avatar = props.avatar;
      var email = props.email;
      var isAdmin = props.isAdmin;


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
      var salt = _bcryptjs2.default.genSaltSync(10);
      var passwordEncrypted = _bcryptjs2.default.hashSync(password, salt);
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

      this.collection.updateAsync(list, [].concat((0, _toConsumableArray3.default)(list), [newUser])).asCallback(function (err) {
        if (err) return callback(err);
        _this2.hash = _nodeUuid2.default.v4();
        process.nextTick(function () {
          return _this2.emit('userCreated', newUser);
        });
        callback(null, newUser);
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

      var username = props.username;
      var password = props.password;
      var smbUsername = props.smbUsername;
      var smbPassword = props.smbPassword;
      var avatar = props.avatar;
      var email = props.email;


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
        change.password = _bcryptjs2.default.hashSync(password, _bcryptjs2.default.genSaltSync(10));
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
        _this3.hash = _nodeUuid2.default.v4();
        process.nextTick(function () {
          return _this3.emit('userUpdated', user, update);
        });
        callback(null, update);
      });
    }

    // to be refactored

  }, {
    key: 'deleteUser',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(uuid) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                if (typeof uuid !== 'string') (0, _throw.throwInvalid)('invalid uuid');
                if (this.collection.locked) (0, _throw.throwBusy)();
                if (this.collection.list.find(function (v) {
                  return v.uuid == uuid;
                }).length == 0) (0, _throw.throwInvalid)('invalid uuid');
                _context.next = 5;
                return this.collection.updateAsync(this.collection.list, this.collection.list.filter(function (v) {
                  return v.uuid !== uuid;
                }));

              case 5:
                return _context.abrupt('return', true);

              case 6:
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

      _bcryptjs2.default.compare(password, user.password, function (err, match) {
        if (err) return callback(err);
        match ? callback(null, user) : callback(null, null);
      });
    }
  }]);
  return UserModel;
}(_events2.default);

var createUserModel = function createUserModel(filepath, tmpdir, callback) {

  (0, _collection.openOrCreateCollectionAsync)(filepath, tmpdir).then(function (collection) {
    return callback(null, new UserModel(collection));
  }).catch(function (e) {
    return callback(e);
  });
};

var createUserModelAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(filepath, tmpfolder) {
    var collection;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _collection.openOrCreateCollectionAsync)(filepath, tmpfolder);

          case 2:
            collection = _context2.sent;

            if (!collection) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt('return', new UserModel(collection));

          case 5:
            return _context2.abrupt('return', null);

          case 6:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function createUserModelAsync(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

// const createUserModelAsync = Promise.promisify(createUserModel)

exports.createUserModelAsync = createUserModelAsync;
exports.createUserModel = createUserModel;