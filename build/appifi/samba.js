'use strict';

var _bluebird = require('bluebird');

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _dgram = require('dgram');

var _dgram2 = _interopRequireDefault(_dgram);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('appifi:samba');

var mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
(0, _bluebird.promisifyAll)(_fs2.default);
(0, _bluebird.promisifyAll)(_child_process2.default);

// stat/event    new request (file change)                 timeout                success                        fail
// init                                                                           idle                           exit
// idle          wait (current req)
// wait          wait (re-timer & req with next new req)   update (current req)    
// update        update (save new req as next req)                                next ? wait(next req) : idle   counter > 3 ? (next ? wait(next req) : idle) : counter + 1 & update (current req)
// exit

var SambaManager = function () {
  function SambaManager(contents) {
    (0, _classCallCheck3.default)(this, SambaManager);

    this.contents = contents;
  }

  (0, _createClass3.default)(SambaManager, [{
    key: 'setState',
    value: function setState(nextState) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.contents.state = new (Function.prototype.bind.apply(nextState, [null].concat([this.contents], args)))();
    }
  }]);
  return SambaManager;
}();

var Idle = function (_SambaManager) {
  (0, _inherits3.default)(Idle, _SambaManager);

  function Idle(contents, data) {
    (0, _classCallCheck3.default)(this, Idle);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Idle.__proto__ || (0, _getPrototypeOf2.default)(Idle)).call(this, contents));

    _this.enter();
    return _this;
  }

  (0, _createClass3.default)(Idle, [{
    key: 'resetSamba',
    value: function resetSamba(data) {
      this.exit();
      this.setState(Wait, data);
    }
  }, {
    key: 'enter',
    value: function enter() {
      console.log('Enter Idle');
    }
  }, {
    key: 'exit',
    value: function exit() {
      console.log('Leave Idle');
    }
  }]);
  return Idle;
}(SambaManager);

var Wait = function (_SambaManager2) {
  (0, _inherits3.default)(Wait, _SambaManager2);

  function Wait(contents, data) {
    (0, _classCallCheck3.default)(this, Wait);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (Wait.__proto__ || (0, _getPrototypeOf2.default)(Wait)).call(this, contents));

    _this2.enter();
    _this2.resetSamba(data);
    return _this2;
  }

  (0, _createClass3.default)(Wait, [{
    key: 'resetSamba',
    value: function resetSamba(data) {
      var _this3 = this;

      clearTimeout(this.timer);
      this.data = data;
      this.timer = setTimeout(function () {
        _this3.exit();
        _this3.setState(Update, _this3.data);
      }, this.contents.delay);
    }
  }, {
    key: 'enter',
    value: function enter() {
      console.log('Enter Wait');
    }
  }, {
    key: 'exit',
    value: function exit() {
      console.log('Leave Wait');
      clearTimeout(this.timer);
    }
  }]);
  return Wait;
}(SambaManager);

var Update = function (_SambaManager3) {
  (0, _inherits3.default)(Update, _SambaManager3);

  function Update(contents, data) {
    (0, _classCallCheck3.default)(this, Update);

    var _this4 = (0, _possibleConstructorReturn3.default)(this, (Update.__proto__ || (0, _getPrototypeOf2.default)(Update)).call(this, contents));

    _this4.contents.counter = 0;
    _this4.enter();
    updateSambaFiles().then(function () {
      console.log(data);
      _this4.success();
      // this.error(err)
    }).catch(function (err) {
      _this4.error(err);
    });
    return _this4;
  }

  (0, _createClass3.default)(Update, [{
    key: 'resetSamba',
    value: function resetSamba(data) {
      this.next = data;
    }
  }, {
    key: 'success',
    value: function success() {
      if (this.next) {
        this.exit();
        this.setState(Wait, this.next);
      } else {
        this.exit();
        this.setState(Idle);
      }
    }
  }, {
    key: 'error',
    value: function error(err) {
      var _this5 = this;

      this.contents.counter += 1;
      if (this.contents.counter >= 3) {
        if (this.next) {
          this.exit();
          this.setState(Wait, this.next);
        } else {
          this.exit();
          this.setState(Idle);
        }
      } else {
        updateSambaFiles().then(function () {
          console.log(data);
          _this5.success();
        }).catch(function (err) {
          console.log('run again');
          _this5.error(err);
        });
      }
    }
  }, {
    key: 'enter',
    value: function enter() {
      console.log('Enter Update');
    }
  }, {
    key: 'exit',
    value: function exit() {
      console.log('Leave Update');
    }
  }]);
  return Update;
}(SambaManager);

var Persistence = function () {
  function Persistence(delay, echo) {
    (0, _classCallCheck3.default)(this, Persistence);

    this.delay = delay || 500;
    this.state = new Idle(this);
  }

  (0, _createClass3.default)(Persistence, [{
    key: 'resetSamba',
    value: function resetSamba(echo) {
      this.state.resetSamba(echo);
    }
  }]);
  return Persistence;
}();

// define some parameters


var userListConfigPath = '../../test/appifi/lib/samba/model.json';
var indexProcessArgv = 0;
var prependPath = null;
// let prependPath = '/home/testonly'

// check & restart samba service
var updatingSamba = false;
var sambaTimer = -1;

// debounce time
var debounceTime = 5000; // millisecond

// turn uuid to unix name
// xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx <- hyphen and M are removed, then prefixed with letter x
var uuidToUnixName = function uuidToUnixName(uuid) {
  return ['x'].concat((0, _toConsumableArray3.default)(uuid.split('-').map(function (s, i) {
    return i === 2 ? s.slice(1) : s;
  }))).join('');
};

// read infors from local file
var getUserListAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var userList;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            userList = {};
            _context.prev = 1;
            _context.next = 4;
            return (0, _bluebird.resolve)(_fs2.default.readFileAsync(userListConfigPath));

          case 4:
            userList = _context.sent;
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](1);
            return _context.abrupt('return');

          case 10:
            return _context.abrupt('return', JSON.parse(userList));

          case 11:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[1, 7]]);
  }));

  return function getUserListAsync() {
    return _ref.apply(this, arguments);
  };
}();

// get users & drives list
var createShareListAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var list, ulist, dlist, shareList;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _bluebird.resolve)(getUserListAsync());

          case 2:
            list = _context2.sent;
            ulist = list['users'];
            dlist = list['drives'];
            shareList = [];

            dlist.forEach(function (drive) {

              if (drive.type === 'private') {

                var _owner = ulist.find(function (user) {
                  return user.home === drive.uuid || user.library === drive.uuid;
                });
                if (_owner) {
                  var shareName = void 0;
                  if (_owner.home === drive.uuid) shareName = _owner.username + ' (home)';else if (_owner.library === drive.uuid) shareName = _owner.username + ' (library)';else shareName = _owner.username + (' (' + drive.uuid.slice(0, 8) + ')');

                  var sharePath = drive.uuid;
                  var validUsers = [_owner.uuid].map(uuidToUnixName);

                  shareList.push({ name: shareName, path: sharePath, validUsers: validUsers });
                }
              } else if (drive.type === 'public') {

                var _shareName = drive.uuid.slice(0, 8);
                var _sharePath = '/drives/' + drive.uuid;

                var writelist = [].concat((0, _toConsumableArray3.default)(drive.writelist)).sort().filter(function (item, index, array) {
                  return !index || item !== array[index - 1];
                }).map(uuidToUnixName);

                var _validUsers = [].concat((0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).sort().filter(function (item, index, array) {
                  return !index || item !== array[index - 1];
                }).map(uuidToUnixName);

                if (_validUsers.length > 0) {
                  shareList.push({ name: _shareName, path: _sharePath,
                    readOnly: owner.library === drive.uuid ? true : false,
                    writelist: writelist, validUsers: _validUsers });
                }
              } else if (drive.type === 'service') {}
            });

            debug('share list', shareList);
            return _context2.abrupt('return', shareList);

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function createShareListAsync() {
    return _ref2.apply(this, arguments);
  };
}();

//***********************************************************************/
// first: retrieve users list from both system, and fruitmix
// second: retrieve users/passwords from both samba, and fruitmix
// third: generate new user map
// fourth: generate new samba configuration
// fifth: reload or restart samba

// get system user list
var retrieveSysUsers = function retrieveSysUsers(callback) {
  _fs2.default.readFile('/etc/passwd', function (err, data) {
    if (err) return callback(err);
    var users = data.toString().split('\n').map(function (l) {
      return l.trim();
    }).filter(function (l) {
      return l.length;
    }).map(function (l) {
      var split = l.split(':');
      if (split.length !== 7) return null;
      return {
        unixname: split[0],
        unixuid: parseInt(split[2])
      };
    }).filter(function (u) {
      return !!u;
    }).filter(function (u) {
      return u.unixuid >= 2000 && u.unixuid < 5000;
    });

    callback(null, users);
  });
};

// get samba user list from local samba service
var retrieveSmbUsers = function retrieveSmbUsers(callback) {
  _child_process2.default.exec('pdbedit -Lw', function (err, stdout) {
    if (err) return callback(err);
    var users = stdout.toString().split('\n').map(function (l) {
      return l.trim();
    }).filter(function (l) {
      return l.length;
    }).map(function (l) {
      var split = l.split(':');
      if (split.length !== 7) return null;
      return {
        unixname: split[0],
        unixuid: parseInt(split[1]),
        md4: split[3],
        lct: split[5]
      };
    }).filter(function (u) {
      return !!u;
    });

    debug('retrieveSmbUsers', stdout.toString().split('\n'));
    callback(null, users);
  });
};

// add user to system
var addUnixUserAsync = function () {
  var _ref3 = (0, _bluebird.method)(function (username, unixuid) {
    debug('addUnixUser', username, unixuid);
    var cmd = 'adduser --disabled-password --disabled-login --no-create-home --gecos ",,," ' + ('--uid ' + unixuid + ' --gid 65534 ' + username);
    return _child_process2.default.execAsync(cmd);
  });

  return function addUnixUserAsync(_x, _x2) {
    return _ref3.apply(this, arguments);
  };
}();

// delete user from system
var deleteUnixUserAsync = function () {
  var _ref4 = (0, _bluebird.method)(function (username) {
    debug('deleteUnixUser', username);
    return _child_process2.default.execAsync('deluser ' + username);
  });

  return function deleteUnixUserAsync(_x3) {
    return _ref4.apply(this, arguments);
  };
}();

// reconcile user list from system & fruitmix
var reconcileUnixUsersAsync = function () {
  var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var sysusers, userList, fusers, common;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _bluebird.resolve)((0, _bluebird.promisify)(retrieveSysUsers)());

          case 2:
            sysusers = _context3.sent;

            debug('reconcile unix users, unix users', sysusers);

            _context3.next = 6;
            return (0, _bluebird.resolve)(getUserListAsync());

          case 6:
            userList = _context3.sent;
            fusers = userList['users'].map(function (u) {
              return { unixname: uuidToUnixName(u.uuid), unixuid: u.unixuid };
            });

            debug('reconcile unix users, fruitmix users', fusers);

            common = new _set2.default();

            fusers.forEach(function (fuser) {
              var found = sysusers.find(function (sysuser) {
                return sysuser.unixname === fuser.unixname && sysuser.unixuid === fuser.unixuid;
              });
              if (found) common.add(found.unixname + ':' + found.unixuid);
            });

            debug('reconcile unix users, common', common);

            fusers = fusers.filter(function (f) {
              return !common.has(f.unixname + ':' + f.unixuid);
            });
            debug('reconcile unix users, fruitmix users (subtracted)', fusers);

            sysusers = sysusers.filter(function (s) {
              return !common.has(s.unixname + ':' + s.unixuid);
            });
            debug('reconcile unix users, unix users (subtracted)', sysusers);

            _context3.next = 18;
            return (0, _bluebird.resolve)((0, _bluebird.map)(sysusers, function (u) {
              return deleteUnixUserAsync(u.unixname).reflect();
            }));

          case 18:
            _context3.next = 20;
            return (0, _bluebird.resolve)((0, _bluebird.map)(fusers, function (u) {
              return addUnixUserAsync(u.unixname, u.unixuid).reflect();
            }));

          case 20:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function reconcileUnixUsersAsync() {
    return _ref5.apply(this, arguments);
  };
}();

// delete samba user from local samba service
var deleteSmbUserAsync = function () {
  var _ref6 = (0, _bluebird.method)(function (username) {
    debug('delete smb user', username);
    return _child_process2.default.execAsync('pdbedit -x ' + username);
  });

  return function deleteSmbUserAsync(_x4) {
    return _ref6.apply(this, arguments);
  };
}();

// add samba user to local samba service
var addSmbUsersAsync = function () {
  var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(fusers) {
    var text;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            text = fusers.map(function (u) {
              return u.unixname + ':' + u.unixuid + ':' + 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:' + (u.md4 + ':[U          ]:' + u.lct + ':');
            }).join('\n');


            debug('addSmbUsers', text);

            _context4.next = 4;
            return (0, _bluebird.resolve)(mkdirpAsync('/run/wisnuc/smb'));

          case 4:
            _context4.next = 6;
            return (0, _bluebird.resolve)(_fs2.default.writeFileAsync('/run/wisnuc/smb/tmp', text));

          case 6:
            _context4.next = 8;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('pdbedit -i smbpasswd:/run/wisnuc/smb/tmp'));

          case 8:
            _context4.t0 = debug;
            _context4.next = 11;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('pdbedit -Lw'));

          case 11:
            _context4.t1 = _context4.sent;
            (0, _context4.t0)('addSmbUsers, after', _context4.t1);

          case 13:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function addSmbUsersAsync(_x5) {
    return _ref7.apply(this, arguments);
  };
}();

// reconcile user list from local samba service & fruitmix
var reconcileSmbUsersAsync = function () {
  var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5() {
    var key, smbusers, userList, fusers, common;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            key = function key(user) {
              return [user.unixname, user.unixuid.toString(), user.md4, user.lct].join(':');
            };

            _context5.next = 3;
            return (0, _bluebird.resolve)((0, _bluebird.promisify)(retrieveSmbUsers)());

          case 3:
            smbusers = _context5.sent;

            debug('reconcile smb users, smbusers', smbusers);

            _context5.next = 7;
            return (0, _bluebird.resolve)(getUserListAsync());

          case 7:
            userList = _context5.sent;
            fusers = userList['users'].map(function (u) {
              return {
                unixname: uuidToUnixName(u.uuid),
                unixuid: u.unixuid,
                md4: u.smbPassword.toUpperCase(),
                lct: 'LCT-' + Math.floor(u.lastChangeTime / 1000).toString(16).toUpperCase() // TODO
              };
            });

            debug('reconcile smb users, fruitmix users', fusers);

            common = new _set2.default();

            fusers.forEach(function (f) {
              var found = smbusers.find(function (s) {
                return s.unixname === f.unixname && s.unixuid === f.unixuid && s.md4 === f.md4 && s.lct === f.lct;
              });
              if (found) common.add(key(found));
            });
            debug('reconcile smb users, common', common);

            smbusers = smbusers.filter(function (s) {
              return !common.has(key(s));
            });
            debug('reconcile smb users, smb users (subtracted)', smbusers);

            fusers = fusers.filter(function (f) {
              return !common.has(key(f));
            });
            debug('reconcile smb users, fruitmix users (subtracted)', fusers);

            // remove
            _context5.next = 19;
            return (0, _bluebird.resolve)((0, _bluebird.map)(smbusers, function (smbuser) {
              return deleteSmbUserAsync(smbuser.unixname).reflect();
            }));

          case 19:
            _context5.next = 21;
            return (0, _bluebird.resolve)(addSmbUsersAsync(fusers));

          case 21:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function reconcileSmbUsersAsync() {
    return _ref8.apply(this, arguments);
  };
}();

// mapping usernames from the clients to the local samba server
var generateUserMapAsync = function () {
  var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6() {
    var userList, text;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return (0, _bluebird.resolve)(getUserListAsync());

          case 2:
            userList = _context6.sent;
            text = userList['users'].reduce(function (prev, user) {
              return prev + (uuidToUnixName(user.uuid) + ' = "' + user.username + '"\n');
            }, '');


            debug('generate usermap', text);
            _context6.next = 7;
            return (0, _bluebird.resolve)(_fs2.default.writeFileAsync('/etc/smbusermap', text));

          case 7:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  }));

  return function generateUserMapAsync() {
    return _ref9.apply(this, arguments);
  };
}();

// create samba's smb.conf
var generateSmbConfAsync = function () {
  var _ref10 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7() {
    var global, section, conf, getShareList;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            global = '[global]\n' + '  username map = /etc/smbusermap\n' + '  workgroup = WORKGROUP\n' + '  netbios name = SAMBA\n' + '  map to guest = Bad User\n' + '  log file = /var/log/samba/%m\n' + '  log level = 1\n\n';

            section = function section(share) {
              var tmpStr = '';
              tmpStr = '[' + share.name + ']\n';
              tmpStr = tmpStr.concat('  path = ' + prependPath + '/' + share.path + '\n' + ('  read only = ' + (share.readOnly ? "yes" : "no") + '\n') + '  guest ok = no\n' + '  force user = root\n' + '  force group = root\n');

              if (!share.readOnly) {
                tmpStr = tmpStr.concat('  write list = ' + (share.validUsers.length > 1 ? share.writelist.join(', ') : share.validUsers) + '\n' + ( // writelist
                '  valid users = ' + (share.validUsers.length > 1 ? share.validUsers.join(', ') : share.validUsers) + '\n') + '  vfs objects = full_audit\n' + '  full_audit:prefix = %u|%U|%S|%P\n' + '  full_audit:success = create_file mkdir rename rmdir unlink write pwrite \n' + // dont remove write !!!!
                '  full_audit:failure = connect\n' + '  full_audit:facility = LOCAL7\n' + '  full_audit:priority = ALERT\n');
              }

              return tmpStr;
            };

            conf = global;
            _context7.next = 5;
            return (0, _bluebird.resolve)(createShareListAsync());

          case 5:
            getShareList = _context7.sent;

            getShareList.forEach(function (share) {
              conf += section(share) + '\n';
            });

            debug('generateSmbConf', conf);
            _context7.next = 10;
            return (0, _bluebird.resolve)(_fs2.default.writeFileAsync('/etc/samba/smb.conf', conf));

          case 10:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  }));

  return function generateSmbConfAsync() {
    return _ref10.apply(this, arguments);
  };
}();

// a class contains samba audit infor which spread with udp

var SmbAudit = function (_EventEmitter) {
  (0, _inherits3.default)(SmbAudit, _EventEmitter);

  function SmbAudit(udp) {
    (0, _classCallCheck3.default)(this, SmbAudit);

    var _this6 = (0, _possibleConstructorReturn3.default)(this, (SmbAudit.__proto__ || (0, _getPrototypeOf2.default)(SmbAudit)).call(this));

    _this6.udp = udp;
    _this6.udp.on('message', function (message, remote) {

      var token = ' smbd_audit: ';

      var text = message.toString();
      var tidx = text.indexOf(' smbd_audit: ');
      if (tidx === -1) return;

      var arr = text.trim().slice(tidx + token.length).split('|');

      // %u <- user
      // %U <- represented user
      // %S <- share
      // %P <- path 

      if (arr.length < 6 || arr[0] !== 'root' || arr[5] !== 'ok') return;

      var user = arr[1];
      var share = arr[2];
      var abspath = arr[3];
      var op = arr[4];
      var arg0 = void 0,
          arg1 = void 0;

      // create_file arg0
      // mkdir
      // rename
      // rmdir
      // unlink (delete file)
      // write (not used anymore)
      // pwrite

      switch (op) {
        case 'create_file':
          if (arr.length !== 10) return;
          if (arr[8] !== 'create') return;
          if (arr[7] !== 'file') return;
          arg0 = arr[9];
          break;

        case 'mkdir':
        case 'rmdir':
        case 'unlink':
        case 'pwrite':
          if (arr.length !== 7) return;
          arg0 = arr[6];
          break;

        case 'rename':
          if (arr.length !== 8) return;
          arg0 = arr[6];
          arg1 = arr[7];
          break;

        default:
          return;
      }

      var audit = { user: user, share: share, abspath: abspath, op: op, arg0: arg0 };
      if (arg1) audit.arg1 = arg1;

      console.log('##################################');
      console.log(audit);
      console.log('##################################');

      return audit;
    });

    _this6.udp.on('close', function () {
      return console.log('smbaudit upd server closed');
    });
    return _this6;
  }

  return SmbAudit;
}(_events2.default);

var updateSambaFiles = function () {
  var _ref11 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8() {
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:

            updatingSamba = true;
            _context8.prev = 1;


            debug('updating samba files');

            _context8.next = 5;
            return (0, _bluebird.resolve)(reconcileUnixUsersAsync());

          case 5:
            _context8.next = 7;
            return (0, _bluebird.resolve)(reconcileSmbUsersAsync());

          case 7:
            _context8.next = 9;
            return (0, _bluebird.resolve)(generateUserMapAsync());

          case 9:
            _context8.next = 11;
            return (0, _bluebird.resolve)(generateSmbConfAsync());

          case 11:

            debug('reloading smbd configuration');
            _context8.next = 14;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('systemctl restart smbd'));

          case 14:
            _context8.next = 18;
            break;

          case 16:
            _context8.prev = 16;
            _context8.t0 = _context8['catch'](1);

          case 18:

            updatingSamba = false;

          case 19:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, undefined, [[1, 16]]);
  }));

  return function updateSambaFiles() {
    return _ref11.apply(this, arguments);
  };
}();

// delay restart samba time for default 1 second
var scheduleUpdate = function scheduleUpdate() {

  if (sambaTimer !== -1) {
    clearTimeout(sambaTimer);
    sambaTimer = -1;
  }

  sambaTimer = setTimeout(function () {

    if (updatingSamba) {
      scheduleUpdate();
      return;
    }
    updateSambaFiles().then(function () {}).catch(function (e) {});
  }, 1000);
};

// initial samba service
var initSamba = function () {
  var _ref12 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee9() {
    var logConfigPath, logConfig, config;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            logConfigPath = '/etc/rsyslog.d/99-smbaudit.conf';
            logConfig = 'LOCAL7.*    @127.0.0.1:3721';

            // update rsyslog config if necessary

            config = null;
            _context9.prev = 3;
            _context9.next = 6;
            return (0, _bluebird.resolve)(_fs2.default.readFileAsync(logConfigPath));

          case 6:
            config = _context9.sent;
            _context9.next = 12;
            break;

          case 9:
            _context9.prev = 9;
            _context9.t0 = _context9['catch'](3);
            debug('initSamba: Not find Samba service');

          case 12:
            if (!(config !== logConfig)) {
              _context9.next = 17;
              break;
            }

            _context9.next = 15;
            return (0, _bluebird.resolve)(_fs2.default.writeFileAsync(logConfigPath, logConfig));

          case 15:
            _context9.next = 17;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('systemctl restart rsyslog'));

          case 17:
            _context9.next = 19;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('systemctl start nmbd'));

          case 19:
            _context9.next = 21;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('systemctl start smbd'));

          case 21:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, undefined, [[3, 9]]);
  }));

  return function initSamba() {
    return _ref12.apply(this, arguments);
  };
}();

// create udp server
var createUdpServer = function createUdpServer(callback) {

  var udp = _dgram2.default.createSocket('udp4');
  udp.on('listening', function () {
    callback(null, new SmbAudit(udp));
  });

  udp.once('error', function (err) {
    if (err.code === 'EADDRINUSE') callback(err);
  });
  udp.bind(3721);
};

// watch file for change
var beginWatch = function () {
  var _ref13 = (0, _bluebird.method)(function () {

    var result = new Persistence(debounceTime);

    var watcher = _fs2.default.watch(userListConfigPath, function (eventType) {

      if (eventType === 'change') {
        result.resetSamba('Only for test!!!');
      }
    });

    return watcher;
  });

  return function beginWatch() {
    return _ref13.apply(this, arguments);
  };
}();

// quit watch
var endWatch = function () {
  var _ref14 = (0, _bluebird.method)(function (watcher) {
    watcher.close();
  });

  return function endWatch(_x6) {
    return _ref14.apply(this, arguments);
  };
}();

// main process for samba service
var prevUsers = void 0,
    prevDrives = void 0;
var watchAndUpdateSambaAsync = function () {
  var _ref15 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee10() {
    var watchMan, udp;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            if (!((indexProcessArgv = process.argv.indexOf('--froot')) >= 0)) {
              _context10.next = 4;
              break;
            }

            prependPath = process.argv[indexProcessArgv + 1];
            _context10.next = 6;
            break;

          case 4:
            debug('generateSmbConfAsync: No "--froot" Parameters');
            return _context10.abrupt('return');

          case 6:
            _context10.next = 8;
            return (0, _bluebird.resolve)(initSamba());

          case 8:
            _context10.next = 10;
            return (0, _bluebird.resolve)(updateSambaFiles());

          case 10:
            _context10.next = 12;
            return (0, _bluebird.resolve)(beginWatch());

          case 12:
            watchMan = _context10.sent;
            _context10.next = 15;
            return (0, _bluebird.resolve)((0, _bluebird.promisify)(createUdpServer)());

          case 15:
            udp = _context10.sent;
            return _context10.abrupt('return', new SmbAudit(udp));

          case 17:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, undefined);
  }));

  return function watchAndUpdateSambaAsync() {
    return _ref15.apply(this, arguments);
  };
}();

watchAndUpdateSambaAsync();