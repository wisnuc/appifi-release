'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

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

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _deepFreeze = require('deep-freeze');

var _deepFreeze2 = _interopRequireDefault(_deepFreeze);

var _types = require('../lib/types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
  data integrity (stateless)
{
  type: 'local'
  
  // basic
x uuid:             // uuid string, required, unique
x username:         // nonempty string, required, unique (in local users)
x password:         // string, required
a nologin:          // bool, default false, required,
  
  // attributes
a isFirstUser:      // bool, required, immutable, only one, 
                    // true only if isAdmin true
a isAdmin:          // bool, required
a email: null,      // null, required
a avatar: null,     // null, required
  
  // drives
  home: <uuid>,     // uuid string, required, exclusive
  library: <uuid>,  // uuid string, required, exclusive
  service: <uuid>,  // uuid string, required, exclusive
  
  // for samba and linux apps
a unixuid:          // 2000 <= integer < 10000, required
  unixname:         // valid unix username, unique
g unixPassword:     // autogen
g smbPassword:      // autogen
g lastChangeTime:   // int, new Date().getTime()

  // for remote 
g credentials: {
    publicKey:      // TBD
    privateKey:     // TBD
  },
a friends: [],      // uuid array, each uuid is a remote user, no dup
}

{
  type: 'remote',
  
  uuid:         // uuid, unique
  username:       // string
  email:        // null
  avatar:         // null
  
  service:        // uuid, exclusive
  
}
**/

var assert = function assert(predicate, message) {
  if (!predicate) throw new Error(message);
};

var unique = function unique(arr) {
  return new _set2.default(arr).size === arr.length;
};

var isUniqueUUIDArray = function isUniqueUUIDArray(arr) {
  return unique(arr) && (arr.every(function (i) {
    return (0, _types.isUUID)(i);
  }) || arr.length === 0);
};

var arrayEqual = function arrayEqual(arr1, arr2) {
  return arr1.length === arr2.length && arr1.every(function (item, index) {
    return item === arr2[index];
  });
};

var isNonEmptyString = function isNonEmptyString(str) {
  return typeof str === 'string' && str.length;
};

var complement = function complement(a, b) {
  return a.reduce(function (acc, c) {
    return b.includes(c) ? acc : [].concat((0, _toConsumableArray3.default)(acc), [c]);
  }, []);
};

var validateProps = function validateProps(obj, mandatory) {
  var optional = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
  return complement((0, _keys2.default)(obj), [].concat((0, _toConsumableArray3.default)(mandatory), (0, _toConsumableArray3.default)(optional))).length === 0 && complement(mandatory, (0, _keys2.default)(obj)).length === 0;
};

var localUserMProps = ['type', 'uuid', 'username', 'password', 'nologin', 'isFirstUser', 'isAdmin', 'email', 'avatar', 'home', 'library', 'service', 'unixuid', 'smbPassword', 'lastChangeTime', 'friends'
// 'credentials', 
];

var localUserOProps = ['unixname', 'unixPassword'];

var validateLocalUser = function validateLocalUser(u) {

  assert(validateProps(u, localUserMProps, localUserOProps), 'invalid object props');

  assert((0, _types.isUUID)(u.uuid), 'invalid user uuid');
  assert(isNonEmptyString(u.username), 'username must be non-empty string');
  assert(isNonEmptyString(u.password), 'password must be non-empty string');
  assert(typeof u.nologin === 'boolean', 'nologin must be boolean');
  assert(typeof u.isFirstUser === 'boolean', 'isFirstUser must be boolean');
  assert(typeof u.isAdmin === 'boolean', 'isAdmin must be boolean');
  assert(u.email === null, 'email must be null');
  assert(u.avatar === null, 'avatar must be null');
  assert((0, _types.isUUID)(u.home), 'invalid home uuid');
  assert((0, _types.isUUID)(u.library), 'invalid library uuid');
  assert((0, _types.isUUID)(u.service), 'invalid service uuid');
  assert((0, _isInteger2.default)(u.unixuid), 'unixuid must be number');
  assert(u.unixuid >= 2000 && u.unixuid < 10000, 'unixuid must be in range 2000 to 10000');

  assert(u.hasOwnProperty('unixPassword') ? isNonEmptyString(u.unixPassword) : true, 'unixPassword must be non-empty string if provided');

  assert(isNonEmptyString(u.smbPassword), 'smbPassword must be non-emty string');
  assert((0, _isInteger2.default)(u.lastChangeTime), 'lastChangeTime must be integer');

  // TODO credentials not asserted
  assert(isUniqueUUIDArray(u.friends), 'friends must be unique uuid array');
};

var remoteUserMProps = ['type', 'uuid', 'email', 'avatar', 'service'];
var remoteUserOProps = ['username'];
var validateRemoteUser = function validateRemoteUser(u) {

  assert(validateProps(u, remoteUserMProps, remoteUserOProps), 'invalid object props');

  assert((0, _types.isUUID)(u.uuid), 'invalid user uuid');
  assert(u.hasOwnProperty('username') ? isNonEmptyString(u.username) : true, 'remote user name must be non-empty string');
  assert(u.email === null, 'email must be null');
  assert(u.avatar === null, 'avatar must be null');
  assert((0, _types.isUUID)(u.service), 'invalid service uuid');
};

var publicDriveMProps = ['uuid', 'type', 'writelist', 'readlist', 'shareAllowed', 'label'];
var validatePublicDrive = function validatePublicDrive(pb) {

  assert(validateProps(pb, publicDriveMProps));

  assert((0, _types.isUUID)(pb.uuid), 'invalid public drive uuid');
  assert(isUniqueUUIDArray(pb.writelist), 'writelist must be unique uuid array');
  assert(isUniqueUUIDArray(pb.readlist), 'readlist must be unique uuid array');
  assert(isUniqueUUIDArray([].concat((0, _toConsumableArray3.default)(pb.writelist), (0, _toConsumableArray3.default)(pb.readlist))), 'writelist and readlist have common user');
  assert(typeof pb.shareAllowed === 'boolean', 'shareAllowed must be boolean');
};

var privateDriveMProps = ['uuid', 'type', 'owner', 'label'];
var validatePrivateDrive = function validatePrivateDrive(pv) {

  assert(validateProps(pv, privateDriveMProps));

  assert((0, _types.isUUID)(pv.uuid), 'invalid drive uuid');
  assert((0, _types.isUUID)(pv.owner), 'invalid drive owner uuid');
};

// a partial model validation
var validateModel = function validateModel(users, drives) {

  // validate user type
  assert(users.every(function (u) {
    return u.type === 'local' || u.type === 'remote';
  }), 'invalid user type');

  var locals = users.filter(function (u) {
    return u.type === 'local';
  }).sort();
  var remotes = users.filter(function (u) {
    return u.type === 'remote';
  }).sort();

  locals.forEach(function (l) {
    return validateLocalUser(l);
  });
  remotes.forEach(function (r) {
    return validateRemoteUser(r);
  });

  // unique user uuid
  assert(unique(users.map(function (u) {
    return u.uuid;
  })), 'user uuid must be unique');

  // unique local username
  assert(unique(locals.map(function (u) {
    return u.username;
  })), 'local username must be uniqe');

  // unique local unixuid
  assert(unique(locals.map(function (u) {
    return u.unixuid;
  })), 'local unixuid must be unique');

  // unique unixname
  assert(unique(locals.filter(function (u) {
    return u.hasOwnProperty('unixname');
  }).map(function (u) {
    return u.unixname;
  })), 'unixname must be unique');

  if (locals.length) {
    // single first user
    assert(locals.filter(function (u) {
      return u.isFirstUser === true;
    }).length === 1, 'single first user');

    // first user admin
    assert(locals.find(function (u) {
      return u.isFirstUser;
    }).isAdmin === true, 'first user must be admin');
  }

  // unique drive label
  assert(unique(drives.map(function (d) {
    return d.label;
  })), 'drive label must be uniqe');

  // validate drive type
  assert(drives.every(function (d) {
    return d.type === 'private' || d.type === 'public';
  }), 'invalid drive type');

  var publics = drives.filter(function (d) {
    return d.type === 'public';
  }).sort();
  var privates = drives.filter(function (d) {
    return d.type === 'private';
  }).sort();

  publics.forEach(function (pb) {
    return validatePublicDrive(pb);
  });
  privates.forEach(function (pv) {
    return validatePrivateDrive(pv);
  });

  // unique drive uuid
  assert(unique(drives.map(function (d) {
    return d.uuid;
  })), 'drive uuid must be unique');

  // bi-directional user-drive relationship
  var udrvs = [].concat((0, _toConsumableArray3.default)(locals.reduce(function (acc, u) {
    return [].concat((0, _toConsumableArray3.default)(acc), [u.home, u.library, u.service]);
  }, [])), (0, _toConsumableArray3.default)(remotes.reduce(function (acc, u) {
    return [].concat((0, _toConsumableArray3.default)(acc), [u.service]);
  }, [])));

  // since privates are unique, this implies
  // 1. all user drives exists, are unique and private
  // 2. all private drive are actually used by users
  var pvuuids = privates.map(function (pv) {
    return pv.uuid;
  });
  assert(arrayEqual(udrvs.sort(), pvuuids.sort()), 'all user drives must be equal to all privates');
};

var invariantProps = function invariantProps(p, c, props) {
  return props.forEach(function (prop) {
    return assert(p[prop] === c[prop], 'invariant ' + prop + ' violated');
  });
};

var invariantUpdateLocalUser = function invariantUpdateLocalUser(p, c) {
  return invariantProps(p, c, ['type', 'uuid', 'password', 'isFirstUser', 'email', 'avatar', 'home', 'library', 'service', 'unixuid', 'unixPassword', 'smbPassword', 'lastChangeTime'
  // , 'credentials'
  ]);
};

var invariantUpdateRemoteUser = function invariantUpdateRemoteUser(p, c) {
  return invariantProps(p, c, ['type', 'uuid', 'service']);
};

var invariantUpdatePassword = function invariantUpdatePassword(p, c) {
  return invariantProps(p, c, ['type', 'uuid', 'username', 'nologin', 'isFirstUser', 'isAdmin', 'email', 'avatar', 'home', 'library', 'service', 'unixuid', 'unixname', 'friends'
  // 'credentials', 
  ]);
};

var invariantUpdatePublicDrive = function invariantUpdatePublicDrive(p, c) {
  return invariantProps(p, c, ['type', 'uuid']);
};

var ModelData = function (_EventEmitter) {
  (0, _inherits3.default)(ModelData, _EventEmitter);

  function ModelData(modelPath, tmpDir) {
    (0, _classCallCheck3.default)(this, ModelData);

    var _this = (0, _possibleConstructorReturn3.default)(this, (ModelData.__proto__ || (0, _getPrototypeOf2.default)(ModelData)).call(this));

    _this.modelPath = modelPath;
    _this.tmpDir = tmpDir;

    _this.users = [];
    _this.drives = [];

    (0, _deepFreeze2.default)(_this.users);
    (0, _deepFreeze2.default)(_this.drives);

    _this.lock = false; // big lock
    return _this;
  }

  (0, _createClass3.default)(ModelData, [{
    key: 'getLock',
    value: function getLock() {
      if (this.lock === true) throw new _error2.default.ELOCK('expect unlocked,actually locked');
      this.lock = true;
    }
  }, {
    key: 'putLock',
    value: function putLock() {
      if (this.lock === false) throw new _error2.default.ELOCK('expect locked,actually unlocked');
      this.lock = false;
    }
  }, {
    key: 'driveMap',
    value: function driveMap(drive) {

      if (drive.type === 'private') {

        var ref = void 0,
            user = this.users.find(function (u) {
          return u.uuid === drive.owner;
        });

        if (user.home === drive.uuid) ref = 'home';else if (user.library === drive.uuid) ref = 'library';else if (user.service === drive.uuid) ref = 'service';else throw new Error('invalid data');

        return (0, _assign2.default)({}, drive, { ref: ref });
      } else return (0, _assign2.default)({}, drive);
    }
  }, {
    key: 'updateModelAsync',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(users, drives) {
        var tmpfile, json;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!this.lock) {
                  _context.next = 2;
                  break;
                }

                throw new _error2.default.ELOCK();

              case 2:
                validateModel(users, drives);
                this.getLock();
                _context.prev = 4;


                // await mkdirpAsync(this.tmpDir)
                tmpfile = _path2.default.join(this.tmpDir, _nodeUuid2.default.v4());
                json = (0, _stringify2.default)({ version: 1, users: users, drives: drives }, null, '  ');
                _context.next = 9;
                return (0, _bluebird.resolve)(_fs2.default.writeFileAsync(tmpfile, json));

              case 9:
                _context.next = 11;
                return (0, _bluebird.resolve)(_fs2.default.renameAsync(tmpfile, this.modelPath));

              case 11:

                this.users = users;
                this.drives = drives;

                (0, _deepFreeze2.default)(this.users);
                (0, _deepFreeze2.default)(this.drives);
                _context.next = 20;
                break;

              case 17:
                _context.prev = 17;
                _context.t0 = _context['catch'](4);
                throw _context.t0;

              case 20:
                _context.prev = 20;
                this.putLock();return _context.finish(20);

              case 23:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 17, 20, 23]]);
      }));

      function updateModelAsync(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return updateModelAsync;
    }()
  }, {
    key: 'initModelAsync',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(users, drives) {
        var _this2 = this;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _bluebird.resolve)(this.updateModelAsync(users, drives));

              case 2:
                // console.log('initModelAsync', drives)
                this.emit('drivesCreated', drives.map(function (d) {
                  return _this2.driveMap(d);
                }));

              case 3:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function initModelAsync(_x4, _x5) {
        return _ref2.apply(this, arguments);
      }

      return initModelAsync;
    }()

    // both local and remote user

  }, {
    key: 'createUserAsync',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(newUser, newDrives) {
        var _this3 = this;

        var nextUsers, nextDrives;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                nextUsers = [].concat((0, _toConsumableArray3.default)(this.users), [newUser]);
                nextDrives = [].concat((0, _toConsumableArray3.default)(this.drives), (0, _toConsumableArray3.default)(newDrives));
                _context3.next = 4;
                return (0, _bluebird.resolve)(this.updateModelAsync(nextUsers, nextDrives));

              case 4:
                this.emit('drivesCreated', newDrives.map(function (d) {
                  return _this3.driveMap(d);
                }));

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function createUserAsync(_x6, _x7) {
        return _ref3.apply(this, arguments);
      }

      return createUserAsync;
    }()

    // both local and remote

  }, {
    key: 'updateUserAsync',
    value: function () {
      var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(next) {
        var index, user, nextUsers;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                index = this.users.findIndex(function (u) {
                  return u.uuid === next.uuid;
                });

                if (!(index === -1)) {
                  _context4.next = 3;
                  break;
                }

                throw new Error('user not found');

              case 3:
                user = this.users[index];

                if (!(user.type === 'local')) {
                  _context4.next = 8;
                  break;
                }

                invariantUpdateLocalUser(user, next);
                _context4.next = 13;
                break;

              case 8:
                if (!(user.type === 'remote')) {
                  _context4.next = 12;
                  break;
                }

                invariantUpdateRemoteUser(user, next);
                _context4.next = 13;
                break;

              case 12:
                throw new Error('user type error');

              case 13:
                nextUsers = [].concat((0, _toConsumableArray3.default)(this.users.slice(0, index)), [next], (0, _toConsumableArray3.default)(this.users.slice(index + 1)));
                _context4.next = 16;
                return (0, _bluebird.resolve)(this.updateModelAsync(nextUsers, this.drives));

              case 16:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function updateUserAsync(_x8) {
        return _ref4.apply(this, arguments);
      }

      return updateUserAsync;
    }()

    // password

  }, {
    key: 'updatePasswordAsync',
    value: function () {
      var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(next) {
        var index, user, nextUsers;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                index = this.users.findIndex(function (u) {
                  return u.uuid === next.uuid;
                });

                if (!(index === -1)) {
                  _context5.next = 3;
                  break;
                }

                throw new Error('user not found');

              case 3:
                user = this.users[index];

                if (!(user.type === 'local')) {
                  _context5.next = 8;
                  break;
                }

                invariantUpdatePassword(user, next);
                _context5.next = 9;
                break;

              case 8:
                throw new Error('user type error');

              case 9:
                nextUsers = [].concat((0, _toConsumableArray3.default)(this.users.slice(0, index)), [next], (0, _toConsumableArray3.default)(this.users.slice(index + 1)));
                _context5.next = 12;
                return (0, _bluebird.resolve)(this.updateModelAsync(nextUsers, this.drives));

              case 12:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function updatePasswordAsync(_x9) {
        return _ref5.apply(this, arguments);
      }

      return updatePasswordAsync;
    }()
  }, {
    key: 'createDriveAsync',
    value: function () {
      var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(newDrive) {
        var nextDrives;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(newDrive.type !== 'public')) {
                  _context6.next = 2;
                  break;
                }

                throw new Error('only create public drive');

              case 2:
                nextDrives = [].concat((0, _toConsumableArray3.default)(this.drives), [newDrive]);
                _context6.next = 5;
                return (0, _bluebird.resolve)(this.updateModelAsync(this.users, nextDrives));

              case 5:
                this.emit('drivesCreated', [this.driveMap(newDrive)]);

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function createDriveAsync(_x10) {
        return _ref6.apply(this, arguments);
      }

      return createDriveAsync;
    }()
  }, {
    key: 'updateDriveAsync',
    value: function () {
      var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7(next) {
        var index, drive, nextDrives;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                index = this.drives.findIndex(function (d) {
                  return d.uuid === next.uuid;
                });

                if (!(index === -1)) {
                  _context7.next = 3;
                  break;
                }

                throw new Error('drive not found');

              case 3:
                drive = this.drives[index];

                if (!(drive.type !== 'public')) {
                  _context7.next = 6;
                  break;
                }

                throw new Error('only update public drive');

              case 6:

                invariantUpdatePublicDrive(drive, next);

                nextDrives = [].concat((0, _toConsumableArray3.default)(this.drives.slice(0, index)), [next], (0, _toConsumableArray3.default)(this.drives.slice(index + 1)));
                _context7.next = 10;
                return (0, _bluebird.resolve)(this.updateModelAsync(this.users, nextDrives));

              case 10:
                this.emit('driveUpdated', this.driveMap(next));

              case 11:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function updateDriveAsync(_x11) {
        return _ref7.apply(this, arguments);
      }

      return updateDriveAsync;
    }()
  }, {
    key: 'deleteDriveAsync',
    value: function () {
      var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8(driveUUID) {
        var index, drive, nextDrives;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                index = this.drives.findIndex(function (d) {
                  return d.uuid === driveUUID;
                });

                if (!(index === -1)) {
                  _context8.next = 3;
                  break;
                }

                throw new Error('drive not found');

              case 3:
                drive = this.drives[index];

                if (!(drive.type !== 'public')) {
                  _context8.next = 6;
                  break;
                }

                throw new Error('only delete public drive');

              case 6:
                nextDrives = [].concat((0, _toConsumableArray3.default)(this.drives.slice(0, index)), (0, _toConsumableArray3.default)(this.drives.slice(index + 1)));
                _context8.next = 9;
                return (0, _bluebird.resolve)(this.updateModelAsync(this.users, nextDrives));

              case 9:
                this.emit('drivesDeleted', [this.driveMap(drive)]);

              case 10:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function deleteDriveAsync(_x12) {
        return _ref8.apply(this, arguments);
      }

      return deleteDriveAsync;
    }()

    // get home, library & public drive

  }, {
    key: 'getDrives',
    value: function getDrives() {
      var _this4 = this;

      return this.drives.filter(function (d) {
        return d.type === 'public' || _this4.driveMap(d).ref === 'home' || _this4.driveMap(d).ref === 'library';
      });
    }

    // get all local user

  }, {
    key: 'getAllLocalUser',
    value: function getAllLocalUser() {
      var locals = this.users.filter(function (u) {
        return u.type === 'local';
      });
      return locals.map(function (u) {
        return (0, _assign2.default)({}, u, {
          password: undefined,
          unixPassword: undefined,
          smbPassword: undefined
        });
      });
    }

    // get all public drive

  }, {
    key: 'getAllPublicDrive',
    value: function getAllPublicDrive() {
      return this.drives.filter(function (d) {
        return d.type === 'public';
      });
    }
  }]);
  return ModelData;
}(_events2.default);

var createModelData = function createModelData(froot) {
  var modelPath = _path2.default.join(froot, 'models/model.json');
  var tmpDir = _path2.default.join(froot, 'tmp');
  return new ModelData(modelPath, tmpDir);
};

exports.default = createModelData;