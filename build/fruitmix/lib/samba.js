'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSmbAudit = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _paths = require('./paths');

var _paths2 = _interopRequireDefault(_paths);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _reducers = require('../../appifi/lib/reducers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:samba');

var mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
(0, _bluebird.promisifyAll)(_fs2.default);
(0, _bluebird.promisifyAll)(_child_process2.default);

var userList = function userList() {
  return _models2.default.getModel('user').collection.list.filter(function (user) {
    return user.type === 'local';
  });
};

// xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx <- hyphen and M are removed, then prefixed with letter x
var uuidToUnixName = function uuidToUnixName(uuid) {
  return ['x'].concat((0, _toConsumableArray3.default)(uuid.split('-').map(function (s, i) {
    return i === 2 ? s.slice(1) : s;
  }))).join('');
};

/**
  share
  
  { 
    name: string,
    readOnly: boolean, (for library)
    path: absolute path in system for samba
    writelist:  only if readOnly === false
    validUsers:
  }
**/
var shareList = function shareList(userList) {

  var umod = _models2.default.getModel('user');
  var dmod = _models2.default.getModel('drive');
  var ulist = umod.collection.list;
  var dlist = dmod.collection.list;

  var shares = [];
  dlist.forEach(function (drive) {

    if (drive.URI !== 'fruitmix') return;

    if (drive.fixedOwner === true) {

      var owner = ulist.find(function (user) {
        return user.home === drive.uuid || user.library === drive.uuid;
      });
      if (owner) {
        var shareName = drive.label; // drive.uuid.slice(0, 8)
        var sharePath = drive.uuid;
        var writelist = [owner.uuid].concat((0, _toConsumableArray3.default)(drive.writelist)).sort().filter(function (item, index, array) {
          return !index || item !== array[index - 1];
        }).map(uuidToUnixName);

        var validUsers = [owner.uuid].concat((0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).sort().filter(function (item, index, array) {
          return !index || item !== array[index - 1];
        }).map(uuidToUnixName);

        shares.push({ name: shareName, path: sharePath,
          readOnly: owner.library === drive.uuid ? true : false,
          writelist: writelist, validUsers: validUsers });
      }
    } else if (drive.fixedOwner === false) {

      var _shareName = drive.uuid.slice(0, 8);
      var _sharePath = '/drives/' + drive.uuid;

      var _writelist = [].concat((0, _toConsumableArray3.default)(drive.owner), (0, _toConsumableArray3.default)(drive.writelist)).sort().filter(function (item, index, array) {
        return !index || item !== array[index - 1];
      }).map(uuidToUnixName);

      var _validUsers = [].concat((0, _toConsumableArray3.default)(drive.owner), (0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).sort().filter(function (item, index, array) {
        return !index || item !== array[index - 1];
      }).map(uuidToUnixName);

      if (_validUsers.length > 0) {
        shares.push({ name: _shareName, path: _sharePath, writelist: _writelist, validUsers: _validUsers });
      }
    }
  });

  return shares;
};

// first: retrieve users list from both system, and fruitmix
// second: retrieve users/passwords from both samba, and fruitmix
// third: generate new user map
// fourth: generate new samba configuration
// fifth: reload or restart samba

var retrieveSysUsers = function retrieveSysUsers(callback) {
  return _fs2.default.readFile('/etc/passwd', function (err, data) {

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
        uid: parseInt(split[2])
      };
    }).filter(function (u) {
      return !!u;
    }).filter(function (u) {
      return u.uid >= 2000 && u.uid < 5000;
    });

    callback(null, users);
  });
};

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
        uid: parseInt(split[1]),
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

var addUnixUserAsync = function () {
  var _ref = (0, _bluebird.method)(function (username, uid) {

    debug('addUnixUser', username, uid);
    var cmd = 'adduser --disabled-password --disabled-login --no-create-home --gecos ",,," ' + ('--uid ' + uid + ' --gid 65534 ' + username);
    return _child_process2.default.execAsync(cmd);
  });

  return function addUnixUserAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var deleteUnixUserAsync = function () {
  var _ref2 = (0, _bluebird.method)(function (username) {

    debug('deleteUnixUser', username);
    return _child_process2.default.execAsync('deluser ' + username);
  });

  return function deleteUnixUserAsync(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var reconcileUnixUsersAsync = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var sysusers, fusers, common;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.promisify)(retrieveSysUsers)();

          case 2:
            sysusers = _context.sent;

            debug('reconcile unix users, unix users', sysusers);

            fusers = userList().map(function (u) {
              return { unixname: uuidToUnixName(u.uuid), uid: u.unixUID };
            });

            debug('reconcile unix users, fruitmix users', fusers);

            common = new _set2.default();

            fusers.forEach(function (fuser) {
              var found = sysusers.find(function (sysuser) {
                return sysuser.unixname === fuser.unixname && sysuser.uid === fuser.uid;
              });
              if (found) common.add(found.unixname + ':' + found.uid);
            });

            debug('reconcile unix users, common', common);

            fusers = fusers.filter(function (f) {
              return !common.has(f.unixname + ':' + f.uid);
            });
            debug('reconcile unix users, fruitmix users (subtracted)', fusers);

            sysusers = sysusers.filter(function (s) {
              return !common.has(s.unixname + ':' + s.uid);
            });
            debug('reconcile unix users, unix users (subtracted)', sysusers);

            _context.next = 15;
            return (0, _bluebird.map)(sysusers, function (u) {
              return deleteUnixUserAsync(u.unixname).reflect();
            });

          case 15:
            _context.next = 17;
            return (0, _bluebird.map)(fusers, function (u) {
              return addUnixUserAsync(u.unixname, u.uid).reflect();
            });

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function reconcileUnixUsersAsync() {
    return _ref3.apply(this, arguments);
  };
}();

var deleteSmbUserAsync = function () {
  var _ref4 = (0, _bluebird.method)(function (username) {
    debug('delete smb user', username);
    return _child_process2.default.execAsync('pdbedit -x ' + username);
  });

  return function deleteSmbUserAsync(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

var addSmbUsersAsync = function () {
  var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(fusers) {
    var text;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            text = fusers.map(function (u) {
              return u.unixname + ':' + u.uid + ':' + 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:' + (u.md4 + ':[U          ]:' + u.lct + ':');
            }).join('\n');


            debug('addSmbUsers', text);

            _context2.next = 4;
            return mkdirpAsync('/run/wisnuc/smb');

          case 4:
            _context2.next = 6;
            return _fs2.default.writeFileAsync('/run/wisnuc/smb/tmp', text);

          case 6:
            _context2.next = 8;
            return _child_process2.default.execAsync('pdbedit -i smbpasswd:/run/wisnuc/smb/tmp');

          case 8:
            _context2.next = 10;
            return _child_process2.default.execAsync('pdbedit -Lw');

          case 10:
            _context2.t0 = _context2.sent;
            debug('addSmbUsers, after', _context2.t0);

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function addSmbUsersAsync(_x5) {
    return _ref5.apply(this, arguments);
  };
}();

var reconcileSmbUsersAsync = function () {
  var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var key, smbusers, fusers, common;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            key = function key(user) {
              return [user.unixname, user.uid.toString(), user.md4, user.lct].join(':');
            };

            _context3.next = 3;
            return (0, _bluebird.promisify)(retrieveSmbUsers)();

          case 3:
            smbusers = _context3.sent;

            debug('reconcile smb users, smbusers', smbusers);

            fusers = userList().map(function (u) {
              return {
                unixname: uuidToUnixName(u.uuid),
                uid: u.unixUID,
                md4: u.smbPassword.toUpperCase(),
                lct: 'LCT-' + Math.floor(u.lastChangeTime / 1000).toString(16).toUpperCase() // TODO
              };
            });

            debug('reconcile smb users, fruitmix users', fusers);

            common = new _set2.default();

            fusers.forEach(function (f) {
              var found = smbusers.find(function (s) {
                return s.unixname === f.unixname && s.uid === f.uid && s.md4 === f.md4 && s.lct === f.lct;
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
            _context3.next = 16;
            return (0, _bluebird.map)(smbusers, function (smbuser) {
              return deleteSmbUserAsync(smbuser.unixname).reflect();
            });

          case 16:
            _context3.next = 18;
            return addSmbUsersAsync(fusers);

          case 18:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function reconcileSmbUsersAsync() {
    return _ref6.apply(this, arguments);
  };
}();

var generateUserMapAsync = function () {
  var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4() {
    var text;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            text = userList().reduce(function (prev, user) {
              return prev + (uuidToUnixName(user.uuid) + ' = "' + user.username + '"\n');
            }, '');


            debug('generate usermap', text);
            _context4.next = 4;
            return _fs2.default.writeFileAsync('/etc/smbusermap', text);

          case 4:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function generateUserMapAsync() {
    return _ref7.apply(this, arguments);
  };
}();

var generateSmbConfAsync = function () {
  var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5() {
    var cfs, prepend, global, section, conf;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            cfs = (0, _reducers.storeState)().sysboot.currentFileSystem;
            prepend = _path2.default.join(cfs.mountpoint, 'wisnuc', 'fruitmix', 'drives');
            global = '[global]\n' + '  username map = /etc/smbusermap\n' + '  workgroup = WORKGROUP\n' + '  netbios name = SAMBA\n' + '  map to guest = Bad User\n' + '  log file = /var/log/samba/%m\n' + '  log level = 1\n\n';

            section = function section(share) {
              return '[' + share.name + ']\n' + ( // username or sharename
              '  path = ' + prepend + '/' + share.path + '\n') + ( // uuid path
              '  read only = ' + (share.readOnly ? "yes" : "no") + '\n') + '  guest ok = no\n' + '  force user = root\n' + '  force group = root\n' + ('  valid users = ' + share.validUsers.join(', ') + '\n') + (share.readOnly ? '' : '  write list = ' + share.writelist.join(', ') + '\n' + // writelist
              '  vfs objects = full_audit\n' + '  full_audit:prefix = %u|%U|%S|%P\n' + '  full_audit:success = create_file mkdir rename rmdir unlink write pwrite \n' + // dont remove write !!!!
              '  full_audit:failure = connect\n' + '  full_audit:facility = LOCAL7\n' + '  full_audit:priority = ALERT\n\n');
            };

            conf = global;

            shareList().forEach(function (share) {
              return conf += section(share);
            });
            debug('generateSmbConf', conf);
            _context5.next = 9;
            return _fs2.default.writeFileAsync('/etc/samba/smb.conf', conf);

          case 9:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined);
  }));

  return function generateSmbConfAsync() {
    return _ref8.apply(this, arguments);
  };
}();

var SmbAudit = function (_EventEmitter) {
  (0, _inherits3.default)(SmbAudit, _EventEmitter);

  function SmbAudit(udp) {
    (0, _classCallCheck3.default)(this, SmbAudit);

    var _this = (0, _possibleConstructorReturn3.default)(this, (SmbAudit.__proto__ || (0, _getPrototypeOf2.default)(SmbAudit)).call(this));

    _this.udp = udp;
    _this.udp.on('message', function (message, remote) {

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

      // debug(arr, audit)

      var filer = _models2.default.getModel('filer');
      filer.requestProbeByAudit(audit);
    });

    _this.udp.on('close', function () {
      return console.log('smbaudit upd server closed');
    });
    return _this;
  }

  return SmbAudit;
}(_events2.default);

var updateSambaFiles = function () {
  var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6() {
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            debug('updating samba files');

            _context6.next = 4;
            return reconcileUnixUsersAsync();

          case 4:
            _context6.next = 6;
            return reconcileSmbUsersAsync();

          case 6:
            _context6.next = 8;
            return generateUserMapAsync();

          case 8:
            _context6.next = 10;
            return generateSmbConfAsync();

          case 10:

            debug('reloading smbd configuration');
            _context6.next = 13;
            return _child_process2.default.execAsync('systemctl reload smbd');

          case 13:
            _context6.next = 18;
            break;

          case 15:
            _context6.prev = 15;
            _context6.t0 = _context6['catch'](0);

            console.log(_context6.t0);

          case 18:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined, [[0, 15]]);
  }));

  return function updateSambaFiles() {
    return _ref9.apply(this, arguments);
  };
}();

var initSamba = function () {
  var _ref10 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7() {
    var logConfigPath, logConfig, config;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            logConfigPath = '/etc/rsyslog.d/99-smbaudit.conf';
            logConfig = 'LOCAL7.*    @127.0.0.1:3721';

            // update rsyslog config if necessary

            config = null;
            _context7.prev = 3;
            _context7.next = 6;
            return _fs2.default.readFileAsync(logConfigPath);

          case 6:
            config = _context7.sent;
            _context7.next = 11;
            break;

          case 9:
            _context7.prev = 9;
            _context7.t0 = _context7['catch'](3);

          case 11:
            if (!(config !== logConfig)) {
              _context7.next = 16;
              break;
            }

            _context7.next = 14;
            return _fs2.default.writeFileAsync(logConfigPath, logConfig);

          case 14:
            _context7.next = 16;
            return _child_process2.default.execAsync('systemctl restart rsyslog');

          case 16:
            _context7.next = 18;
            return _child_process2.default.execAsync('systemctl start nmbd');

          case 18:
            _context7.next = 20;
            return _child_process2.default.execAsync('systemctl start smbd');

          case 20:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined, [[3, 9]]);
  }));

  return function initSamba() {
    return _ref10.apply(this, arguments);
  };
}();

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

var createSmbAuditAsync = function () {
  var _ref11 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8() {
    var udp;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return initSamba();

          case 2:
            _context8.next = 4;
            return updateSambaFiles();

          case 4:
            _context8.next = 6;
            return (0, _bluebird.promisify)(createUdpServer)();

          case 6:
            udp = _context8.sent;
            return _context8.abrupt('return', new SmbAudit(udp));

          case 8:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, undefined);
  }));

  return function createSmbAuditAsync() {
    return _ref11.apply(this, arguments);
  };
}();

var createSmbAudit = exports.createSmbAudit = function createSmbAudit(callback) {
  return createSmbAuditAsync().asCallback(callback);
};