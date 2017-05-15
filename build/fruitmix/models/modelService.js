'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _ursa = require('ursa');

var _ursa2 = _interopRequireDefault(_ursa);

var _crypt = require('crypt3');

var _crypt2 = _interopRequireDefault(_crypt);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _tools = require('../tools');

var _types = require('../lib/types');

var _modelData = require('./modelData');

var _modelData2 = _interopRequireDefault(_modelData);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import EventEmitter from 'events'

(0, _bluebird.promisifyAll)(_fs2.default);

var passwordEncrypt = function passwordEncrypt(password, saltLen) {
  return _bcrypt2.default.hashSync(password, _bcrypt2.default.genSaltSync(saltLen));
};

var getCredentials = function getCredentials() {
  var key = _ursa2.default.generatePrivateKey(512, 65537);
  var privatePem = _ursa2.default.createPrivateKey(key.toPrivatePem());
  var privateKey = privatePem.toPrivatePem('utf8');
  var publicPem = _ursa2.default.createPublicKey(key.toPublicPem());
  var publicKey = publicPem.toPublicPem('utf8');
  return { publicKey: publicKey, privateKey: privateKey };
};

var getUnixPwdEncrypt = function getUnixPwdEncrypt(password) {
  return (0, _crypt2.default)(password, _crypt2.default.createSalt('sha512').slice(0, 11));
};

var arrDedup = function arrDedup(arr1, arr2) {
  return (0, _from2.default)(new _set2.default([].concat((0, _toConsumableArray3.default)(arr1), (0, _toConsumableArray3.default)(arr2))));
};

var upgradeData = function upgradeData(users, drives) {

  var newDrives = drives.map(function (drive) {
    return {
      uuid: drive.uuid,
      label: drive.label,
      type: 'private',
      owner: drive.owner[0]
    };
  });

  var newUsers = users.map(function (user) {
    var u = (0, _assign2.default)({}, user);
    u.unixuid = user.unixUID;
    delete u.unixUID;
    u.nologin = false;
    // u.unixname = '';       // ???
    // u.unixPassword = '';   // ???
    u.friends = [];
    // u.credentials = getCredentials();
    // create service drive
    u.service = _nodeUuid2.default.v4();
    newDrives.push({
      uuid: u.service,
      label: u.username + ' service',
      type: 'private',
      owner: u.uuid
    });
    return u;
  });

  return { users: newUsers, drives: newDrives };
};

var ModelService = function () {
  function ModelService(froot, modelData) {
    (0, _classCallCheck3.default)(this, ModelService);

    // super();
    this.froot = froot;
    this.modelData = modelData;
  }

  (0, _createClass3.default)(ModelService, [{
    key: 'allocUnixUID',
    value: function allocUnixUID() {
      var uids = this.modelData.users.filter(function (u) {
        return u.type === 'local';
      }).map(function (u) {
        return u.unixuid;
      });
      var set = new _set2.default(uids);
      var uid = void 0;
      for (uid = 2000; set.has(uid); uid++) {}
      return uid;
    }
  }, {
    key: 'initializeFallbackAsync',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
        var mpath, upath, dpath, users, drives, obj;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                mpath = _path2.default.join(this.froot, 'models/model.json');
                upath = _path2.default.join(_path2.default.dirname(mpath), 'users.json');
                dpath = _path2.default.join(_path2.default.dirname(mpath), 'drives.json');
                _context.prev = 3;
                _context.t0 = JSON;
                _context.next = 7;
                return (0, _bluebird.resolve)(_fs2.default.readFileAsync(upath));

              case 7:
                _context.t1 = _context.sent;
                users = _context.t0.parse.call(_context.t0, _context.t1);
                _context.t2 = JSON;
                _context.next = 12;
                return (0, _bluebird.resolve)(_fs2.default.readFileAsync(dpath));

              case 12:
                _context.t3 = _context.sent;
                drives = _context.t2.parse.call(_context.t2, _context.t3);
                obj = upgradeData(users, drives);
                _context.next = 17;
                return (0, _bluebird.resolve)(this.modelData.initModelAsync(obj.users, obj.drives));

              case 17:
                return _context.abrupt('return', _context.sent);

              case 20:
                _context.prev = 20;
                _context.t4 = _context['catch'](3);

                if (!(_context.t4.code !== 'ENOENT')) {
                  _context.next = 24;
                  break;
                }

                throw _context.t4;

              case 24:
                _context.next = 26;
                return (0, _bluebird.resolve)(this.modelData.initModelAsync([], []));

              case 26:
                return _context.abrupt('return', _context.sent);

              case 27:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 20]]);
      }));

      function initializeFallbackAsync() {
        return _ref.apply(this, arguments);
      }

      return initializeFallbackAsync;
    }()

    // opaque

  }, {
    key: 'initializeAsync',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
        var mpath, data;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                mpath = _path2.default.join(this.froot, 'models/model.json');
                _context2.t0 = JSON;
                _context2.next = 5;
                return (0, _bluebird.resolve)(_fs2.default.readFileAsync(mpath));

              case 5:
                _context2.t1 = _context2.sent;
                data = _context2.t0.parse.call(_context2.t0, _context2.t1);
                _context2.next = 9;
                return (0, _bluebird.resolve)(this.modelData.initModelAsync(data.users, data.drives));

              case 9:
                return _context2.abrupt('return', _context2.sent);

              case 12:
                _context2.prev = 12;
                _context2.t2 = _context2['catch'](0);

                if (!(_context2.t2.code !== 'ENOENT')) {
                  _context2.next = 16;
                  break;
                }

                throw _context2.t2;

              case 16:
                _context2.next = 18;
                return (0, _bluebird.resolve)(this.initializeFallbackAsync());

              case 18:
                return _context2.abrupt('return', _context2.sent);

              case 19:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 12]]);
      }));

      function initializeAsync() {
        return _ref2.apply(this, arguments);
      }

      return initializeAsync;
    }()

    // async createLocalUserAsync({ useruuid, props }) {

  }, {
    key: 'createLocalUserAsync',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(args) {
        var useruuid, props, users, admins, type, username, password, nologin, isFirstUser, isAdmin, email, avatar, unixname, uuid, home, library, service, unixuid, lastChangeTime, passwordEncrypted, unixPassword, smbPassword, friends, newUser, common, homeDrive, libraryDrive, serviceDrive, newDrives;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                useruuid = args.useruuid, props = args.props;
                /** 
                creating the first useruuid is undefined
                props {
                  *  type: 'local',
                  *  username,     // string
                  *  password,     // string
                  o  unixname      // string
                  a  nologin,      // bool
                  a  isFirstUser,  // bool
                  a  isAdmin,      // bool
                  a  email,        // string
                  a  avatar,       // string
                }
                **/

                // check permission

                users = this.modelData.users;
                admins = users.filter(function (u) {
                  return u.isAdmin === true;
                }).map(function (u) {
                  return u.uuid;
                });

                if (!(users.length !== 0 && !admins.includes(useruuid))) {
                  _context3.next = 5;
                  break;
                }

                throw new Error('must be an administrator to create a user');

              case 5:
                if (!(props.type !== 'local')) {
                  _context3.next = 7;
                  break;
                }

                throw new Error('the new user type must be local');

              case 7:
                // install newUser
                type = props.type, username = props.username, password = props.password, nologin = props.nologin, isFirstUser = props.isFirstUser, isAdmin = props.isAdmin, email = props.email, avatar = props.avatar, unixname = props.unixname;
                // user uuid

                uuid = _nodeUuid2.default.v4();


                if (nologin !== true) nologin = false;
                if (isAdmin !== true) isAdmin = false;
                if (isFirstUser !== true) isFirstUser = false;
                if (users.length === 0) {
                  isFirstUser = true;
                  isAdmin = true;
                }

                email = email || null;
                avatar = avatar || null;

                home = _nodeUuid2.default.v4();
                library = _nodeUuid2.default.v4();
                service = _nodeUuid2.default.v4();
                // alloc unix uid

                unixuid = this.allocUnixUID();
                lastChangeTime = new Date().getTime();
                passwordEncrypted = passwordEncrypt(password, 10);
                unixPassword = getUnixPwdEncrypt(password);
                smbPassword = (0, _tools.md4Encrypt)(password);
                friends = [];
                // get credentials
                // let credentials = getCredentials();

                newUser = {
                  type: type, uuid: uuid, username: username, nologin: nologin, isFirstUser: isFirstUser, isAdmin: isAdmin,
                  email: email, avatar: avatar, home: home, library: library, service: service, unixuid: unixuid,
                  unixname: unixname, lastChangeTime: lastChangeTime, friends: friends,
                  unixPassword: unixPassword, smbPassword: smbPassword,
                  password: passwordEncrypted
                  // , credentials
                };

                if (!newUser.unixname) delete newUser.unixname;
                // install newDrives
                common = { owner: uuid, type: 'private' };
                homeDrive = (0, _assign2.default)({}, common, { uuid: home, label: username + ' home' });
                libraryDrive = (0, _assign2.default)({}, common, { uuid: library, label: username + ' library' });
                serviceDrive = (0, _assign2.default)({}, common, { uuid: service, label: username + ' service' });
                newDrives = [homeDrive, libraryDrive, serviceDrive];
                _context3.next = 33;
                return (0, _bluebird.resolve)(this.modelData.createUserAsync(newUser, newDrives));

              case 33:
                return _context3.abrupt('return', {
                  type: type, uuid: uuid, username: username, nologin: nologin, isFirstUser: isFirstUser, isAdmin: isAdmin,
                  email: email, avatar: avatar, home: home, library: library, service: service, unixuid: unixuid,
                  unixname: unixname, lastChangeTime: lastChangeTime, friends: friends
                });

              case 34:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function createLocalUserAsync(_x) {
        return _ref3.apply(this, arguments);
      }

      return createLocalUserAsync;
    }()

    // async createRemoteUserAsync({ useruuid, props }) {

  }, {
    key: 'createRemoteUserAsync',
    value: function () {
      var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(args) {
        var useruuid, props, users, admins, type, username, uuid, email, avatar, service, newUser, newDrives;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                useruuid = args.useruuid, props = args.props;
                /** 
                props {
                  *  type: 'remote',
                  *  username,       // string
                  a  email,          // string
                  a  avatar,         // string
                }
                **/

                // check permission

                users = this.modelData.users;
                admins = users.filter(function (u) {
                  return u.isAdmin === true;
                }).map(function (u) {
                  return u.uuid;
                });

                if (admins.includes(useruuid)) {
                  _context4.next = 5;
                  break;
                }

                throw new Error('must be an administrator to create a user');

              case 5:
                if (!(props.type !== 'remote')) {
                  _context4.next = 7;
                  break;
                }

                throw new Error('the new user type must be remote');

              case 7:
                // install newUser
                type = 'remote';
                username = props.username;
                uuid = _nodeUuid2.default.v4();
                email = props.email || null;
                avatar = props.email || null;
                service = _nodeUuid2.default.v4();
                newUser = { type: type, uuid: uuid, username: username, email: email, avatar: avatar, service: service };
                // install newdrives

                newDrives = [{
                  uuid: service,
                  type: 'private',
                  owner: uuid,
                  label: uuid + ' service'
                }];
                _context4.next = 17;
                return (0, _bluebird.resolve)(this.modelData.createUserAsync(newUser, newDrives));

              case 17:
                return _context4.abrupt('return', { type: type, username: username, uuid: uuid, email: email, avatar: avatar, service: service });

              case 18:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function createRemoteUserAsync(_x2) {
        return _ref4.apply(this, arguments);
      }

      return createRemoteUserAsync;
    }()

    // async updateUserAsync({ useruuid, props }) {

  }, {
    key: 'updateUserAsync',
    value: function () {
      var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(args) {
        var useruuid, props, permissionUser, user, next, newUser;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                useruuid = args.useruuid, props = args.props;
                // check permission

                permissionUser = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });
                user = this.modelData.users.find(function (u) {
                  return u.uuid === props.uuid;
                });

                if (user) {
                  _context5.next = 5;
                  break;
                }

                throw new Error('user does not exist');

              case 5:
                if (!(!permissionUser.isAdmin && useruuid !== user.uuid)) {
                  _context5.next = 7;
                  break;
                }

                throw new Error('no permission to change user information');

              case 7:
                next = (0, _assign2.default)({}, user, props);
                _context5.next = 10;
                return (0, _bluebird.resolve)(this.modelData.updateUserAsync(next));

              case 10:
                newUser = (0, _assign2.default)({}, next);

                delete newUser.password;
                delete newUser.smbPassword;
                delete newUser.unixPassword;
                return _context5.abrupt('return', newUser);

              case 15:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function updateUserAsync(_x3) {
        return _ref5.apply(this, arguments);
      }

      return updateUserAsync;
    }()

    // async updatePasswordAsync({ useruuid, props }) {

  }, {
    key: 'updatePasswordAsync',
    value: function () {
      var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(args) {
        var useruuid, props, pwd, permissionUser, user, password, unixPassword, smbPassword, lastChangeTime, next;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                useruuid = args.useruuid, props = args.props;
                pwd = props.password;
                // check permission

                permissionUser = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });
                user = this.modelData.users.find(function (u) {
                  return u.uuid === props.uuid;
                });

                if (user) {
                  _context6.next = 6;
                  break;
                }

                throw new Error('user does not exist');

              case 6:
                if (!(!permissionUser.isAdmin && useruuid !== user.uuid)) {
                  _context6.next = 8;
                  break;
                }

                throw new Error('no permission to change user information');

              case 8:
                if (!(user.type !== 'local')) {
                  _context6.next = 10;
                  break;
                }

                throw new Error('local user password only');

              case 10:

                // install user
                password = passwordEncrypt(pwd, 10);
                unixPassword = getUnixPwdEncrypt(pwd);
                smbPassword = (0, _tools.md4Encrypt)(pwd);
                lastChangeTime = new Date().getTime();
                next = (0, _assign2.default)({}, user, { password: password, unixPassword: unixPassword, smbPassword: smbPassword, lastChangeTime: lastChangeTime });
                _context6.next = 17;
                return (0, _bluebird.resolve)(this.modelData.updatePasswordAsync(next));

              case 17:
                return _context6.abrupt('return', null);

              case 18:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function updatePasswordAsync(_x4) {
        return _ref6.apply(this, arguments);
      }

      return updatePasswordAsync;
    }()
  }, {
    key: 'createFriendAsync',
    value: function () {
      var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7(useruuid, friend) {
        var user, newFriends, next;
        return _regenerator2.default.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                // check permission
                user = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });

                if (user) {
                  _context7.next = 3;
                  break;
                }

                throw new Error('user does not exist');

              case 3:
                // install user
                newFriends = arrDedup(user.friends, [friend]);
                next = (0, _assign2.default)({}, user, { friends: newFriends });
                _context7.next = 7;
                return (0, _bluebird.resolve)(this.modelData.updateUserAsync(next));

              case 7:
                return _context7.abrupt('return', next);

              case 8:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function createFriendAsync(_x5, _x6) {
        return _ref7.apply(this, arguments);
      }

      return createFriendAsync;
    }()
  }, {
    key: 'deleteFriendAsync',
    value: function () {
      var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8(useruuid, friend) {
        var user, newFriends, next;
        return _regenerator2.default.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:

                // check permission
                user = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });

                if (user) {
                  _context8.next = 3;
                  break;
                }

                throw new Error('user does not exist');

              case 3:
                // install user
                newFriends = (0, _types.complement)(user.friends, [friend]);
                next = (0, _assign2.default)({}, user, { friends: newFriends });
                _context8.next = 7;
                return (0, _bluebird.resolve)(this.modelData.updateUserAsync(next));

              case 7:
                return _context8.abrupt('return', next);

              case 8:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function deleteFriendAsync(_x7, _x8) {
        return _ref8.apply(this, arguments);
      }

      return deleteFriendAsync;
    }()
  }, {
    key: 'createPublicDriveAsync',
    value: function () {
      var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee9(args) {
        var useruuid, props, admin, uuid, type, writelist, readlist, shareAllowed, label, newDrive;
        return _regenerator2.default.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                useruuid = args.useruuid, props = args.props;
                /*
                  props {
                    writerlist,   // array
                    readlist,     // array
                    shareAllowed  // bool
                  }
                */
                // check permission

                admin = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });

                if (admin) {
                  _context9.next = 4;
                  break;
                }

                throw new Error('no permission to create public drive');

              case 4:
                //install new drive
                uuid = _nodeUuid2.default.v4();
                type = 'public';
                writelist = props.writelist || [];
                readlist = props.readlist || [];
                shareAllowed = props.shareAllowed === true ? true : false;
                label = props.label || uuid;
                newDrive = { uuid: uuid, type: type, label: label, writelist: writelist, readlist: readlist, shareAllowed: shareAllowed };
                _context9.next = 13;
                return (0, _bluebird.resolve)(this.modelData.createDriveAsync(newDrive));

              case 13:
                return _context9.abrupt('return', newDrive);

              case 14:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function createPublicDriveAsync(_x9) {
        return _ref9.apply(this, arguments);
      }

      return createPublicDriveAsync;
    }()
  }, {
    key: 'updatePublicDriveAsync',
    value: function () {
      var _ref10 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee10(args) {
        var useruuid, props, admin, drives, drive, next;
        return _regenerator2.default.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                useruuid = args.useruuid, props = args.props;
                /*
                  props {
                    writerlist,   // array
                    readlist,     // array
                    shareAllowed  // bool
                  }
                */
                // check permission

                admin = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });

                if (admin) {
                  _context10.next = 4;
                  break;
                }

                throw new Error('no permission to create public drive');

              case 4:
                // install next drive
                drives = this.modelData.drives;
                drive = drives.find(function (d) {
                  return d.uuid === props.uuid;
                });
                next = (0, _assign2.default)({}, drive, props);
                _context10.next = 9;
                return (0, _bluebird.resolve)(this.modelData.updateDriveAsync(next));

              case 9:
                return _context10.abrupt('return', next);

              case 10:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function updatePublicDriveAsync(_x10) {
        return _ref10.apply(this, arguments);
      }

      return updatePublicDriveAsync;
    }()
  }, {
    key: 'deletePublicDriveAsync',
    value: function () {
      var _ref11 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee11(useruuid, props) {
        var admin, drive;
        return _regenerator2.default.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:

                // check permission
                admin = this.modelData.users.find(function (u) {
                  return u.uuid === useruuid;
                });

                if (admin) {
                  _context11.next = 3;
                  break;
                }

                throw new Error('no permission to create public drive');

              case 3:
                drive = this.modelData.drives.find(function (d) {
                  return d.uuid === props.driveuuid;
                });
                // delete

                _context11.next = 6;
                return (0, _bluebird.resolve)(this.modelData.deleteDriveAsync(props.driveuuid));

              case 6:
                return _context11.abrupt('return', null);

              case 7:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function deletePublicDriveAsync(_x11, _x12) {
        return _ref11.apply(this, arguments);
      }

      return deletePublicDriveAsync;
    }()

    // determine whether local users

  }, {
    key: 'isLocalUser',
    value: function () {
      var _ref12 = (0, _bluebird.method)(function (useruuid) {
        // find user by uuid
        var user = this.modelData.users.find(function (u) {
          return u.uuid === useruuid;
        });
        if (!user) throw new Error('user not found');
        return user.type === 'local';
      });

      function isLocalUser(_x13) {
        return _ref12.apply(this, arguments);
      }

      return isLocalUser;
    }()

    // get drive info

  }, {
    key: 'getDriveInfo',
    value: function getDriveInfo(driveuuid, callback) {
      // find drive by uuid
      var drive = this.modelData.drives.find(function (d) {
        return d.uuid === driveuuid;
      });
      if (!drive) callback(new Error('drive not found'));else if (drive.owner) {
        // not public drive get ownername
        var ownername = this.modelData.users.find(function (u) {
          return u.uuid === drive.owner;
        }).username;
        callback(null, (0, _assign2.default)({}, drive, { ownername: ownername }));
      } else callback(null, drive);
    }

    //get account info

  }, {
    key: 'getAccountInfo',
    value: function getAccountInfo(useruuid, callback) {
      var user = this.modelData.users.find(function (u) {
        return u.uuid === useruuid;
      });
      if (!user) return callback(new Error('user not found'));
      delete user.password;
      delete user.unixPassword;
      delete user.smbPassword;
      callback(null, user);
    }

    // get home, library, & public drive

  }, {
    key: 'getDrives',
    value: function getDrives(callback) {
      callback(null, this.modelData.getDrives());
    }

    // get user friends

  }, {
    key: 'getUserFriends',
    value: function getUserFriends(useruuid, callback) {
      var user = this.modelData.users.find(function (u) {
        return u.uuid === useruuid && u.type === 'local';
      });
      if (!user) return callback(new Error('no local users'));
      callback(null, user.friends);
    }

    // get all local user

  }, {
    key: 'getAllLocalUser',
    value: function getAllLocalUser(useruuid, callback) {
      var user = this.modelData.users.find(function (u) {
        return u.uuid === useruuid && u.isAdmin;
      });
      if (!user) return callback(new Error('no permission to get all local user'));
      callback(null, this.modelData.getAllLocalUser());
    }

    // get all public drive

  }, {
    key: 'getAllPublicDrive',
    value: function getAllPublicDrive(useruuid, callback) {
      var user = this.modelData.users.find(function (u) {
        return u.uuid === useruuid && u.isAdmin;
      });
      if (!user) return callback(new Error('no permission to get all local user'));
      callback(null, this.modelData.getAllPublicDrive());
    }
  }, {
    key: 'register',
    value: function register(ipc) {
      var _this = this;

      ipc.register('createLocalUser', function (args, callback) {
        return _this.createLocalUserAsync(args).asCallback(callback);
      });
      ipc.register('createRemoteUser', function (args, callback) {
        return _this.createRemoteUserAsync(args).asCallback(callback);
      });
      ipc.register('updateUser', function (args, callback) {
        return _this.updateUserAsync(args).asCallback(callback);
      });
      ipc.register('updatePassword', function (args, callback) {
        return _this.updatePasswordAsync(args).asCallback(callback);
      });
      ipc.register('isLocalUser', function (args, callback) {
        return _this.isLocalUser(args).asCallback(callback);
      });
      ipc.register('createPublicDrive', function (args, callback) {
        return _this.createPublicDriveAsync(args).asCallback(callback);
      });
      ipc.register('updatePublicDrive', function (args, callback) {
        return _this.updatePublicDriveAsync(args).asCallback(callback);
      });
      ipc.register('getDriveInfo', function (args, callback) {
        return _this.getDriveInfo(args, callback);
      });
      ipc.register('getDrives', function (args, callback) {
        return _this.getDrives(callback);
      });
      ipc.register('getAccountInfo', function (args, callback) {
        return _this.getAccountInfo(args, callback);
      });
      ipc.register('getUserFriends', function (args, callback) {
        return _this.getUserFriends(args, callback);
      });
      ipc.register('getAllLocalUser', function (args, callback) {
        return _this.getAllLocalUser(args, callback);
      });
      ipc.register('getAllPublicDrive', function (args, callback) {
        return _this.getAllPublicDrive(args, callback);
      });
    }
  }]);
  return ModelService;
}();

var createModelService = function createModelService(froot) {
  return new ModelService(froot, (0, _modelData2.default)(froot));
};

exports.default = createModelService;