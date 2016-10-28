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

var _paths = require('./paths');

var _paths2 = _interopRequireDefault(_paths);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:samba');

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
        var shareName = drive.uuid.slice(0, 8);
        var sharePath = '/drives/' + drive.uuid;
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
        uid: split[2]
      };
    }).filter(function (u) {
      return !!u;
    });

    callback(null, users);
  });
};

var retrieveSmbUsers = function retrieveSmbUsers(callback) {

  _child_process2.default.exec('pdbedit -Lw', function (err, stdout) {
    if (err) return callback(err);
    var users = data.toString().split('\n').map(function (l) {
      return l.trim();
    }).filter(function (l) {
      return l.length;
    }).map(function (l) {
      var split = l.split(':');
      if (split.length !== 6) return null;
      return {
        unixname: split[0],
        uid: parseInt(split[1]),
        md4: split[3],
        lct: split[5]
      };
    }).filter(function (u) {
      return !!u;
    });

    callback(null, users);
  });
};

var addUnixUser = function addUnixUser(username, uid, callback) {
  return _child_process2.default.exec('adduser --disabled-password --disabled-login --no-create-home ' + ('--gecos ",,," --uid ' + uid + ' --gid 65534 ' + username + '\n'), function (err) {
    return callback(err);
  });
};

var deleteUnixUser = function deleteUnixUser(username, callback) {
  return _child_process2.default.exec('deluser ' + username, function (err) {
    return callback(err);
  });
};

var reconcileUnixUserAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var sysusers, fusers, common;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.promisify)(retrieveSysUsers);

          case 2:
            sysusers = _context.sent;
            fusers = userList().map(function (u) {
              return { unixname: uuidToUnixName(u.uuid), uid: u.unixUID };
            });

            // common

            common = [];

            fusers.forEach(function (fuser) {
              var found = sysusers.find(function (sysuser) {
                return sysuser.unixname === fuser.unixname && sysuser.uid === fuser.uid;
              });
              if (found) common.push({ fuser: fuser });
            });

            // subtract
            fusers = fusers.filter(function (f) {
              return common.find(function (c) {
                return c.unixname === f.unixname && c.uid === f.uid;
              });
            });
            sysusers = sysusers.filter(function (s) {
              return common.find(function (c) {
                return c.unixname === s.unixname && c.uid === s.uid;
              });
            });

            // delete, with bluebird reflect
            _context.next = 10;
            return (0, _bluebird.map)(sysusers, function (sysuser) {
              return deleteUnixUser(sysuser.unixname).reflect();
            });

          case 10:
            _context.next = 12;
            return (0, _bluebird.map)(fusers, function (fuser) {
              return addUnixUser(fuser.unixname).reflect();
            });

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function reconcileUnixUserAsync() {
    return _ref.apply(this, arguments);
  };
}();

var deleteSmbUser = function deleteSmbUser(username, callback) {
  return _child_process2.default.exec('pdbedit -x ' + username, function (err) {
    return callback(err);
  });
};

var smbTmpUserPath = '/run/wisnuc/smb/tmp';

var addSmbUsers = function addSmbUsers(fusers, callback) {

  var text = fusers.map(function (u) {
    return u.unixname + ':' + u.uid + ':' + 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:' + (u.md4 + ':[U          ]:' + u.lct + ':');
  }).join('\n');

  _fs2.default.writeFile(smbTmpUserPath, text, function (err) {
    return err ? callback(err) : _child_process2.default.exec('pdbedit -i smbpasswd:' + smbTmpUserPath, function (err) {
      return callback(err);
    });
  });
};

var reconcileSmbUserAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var smbusers, fusers, common;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _bluebird.promisify)(retrieveSmbUsers);

          case 2:
            smbusers = _context2.sent;
            fusers = userList().map(function (u) {
              return {
                unixname: uuidToUnixName(u.uuid),
                uid: u.unixUID,
                md4: u.smbPassword.toUpperCase(),
                lct: 'LCT-' + Math.floor(u.lastChangeTime / 1000).toString('hex').toUpperCase()
              };
            });
            common = fusers.reduce(function (r, f) {
              return smbusers.find(function (s) {
                return s.unixname === curr.unixname && s.uid === f.uid && s.md4 === f.md4 ? [].concat((0, _toConsumableArray3.default)(r), [{ f: f, s: s }]) : r;
              }, []);
            });


            fusers = fusers.filter(function (f) {
              return common.find(function (c) {
                return c.f !== f;
              });
            });
            smbusers = smbusers.filter(function (s) {
              return common.find(function (c) {
                return c.s !== s;
              });
            });

            // remove
            _context2.next = 9;
            return (0, _bluebird.map)(smbusers, function (smbuser) {
              return deleteSmbUser(smbuser.unixname).reflect();
            });

          case 9:
            _context2.next = 11;
            return (0, _bluebird.promisify)(addSmbUsers)(fusers);

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function reconcileSmbUserAsync() {
    return _ref2.apply(this, arguments);
  };
}();

var generateUserMap = function generateUserMap() {
  return userList().reduce(function (prev, user) {
    return prev + (uuidToUnixName(user.uuid) + ' = "' + user.username + '"\n');
  }, '');
};

var generateSmbConf = function generateSmbConf() {

  var global = '[global]\n' + '  username map = /usernamemap.txt\n' + '  workgroup = WORKGROUP\n' + '  netbios name = SAMBA\n' + '  map to guest = Bad User\n' + '  log file = /var/log/samba/%m\n' + '  log level = 1\n\n';

  var section = function section(share) {
    return '[' + share.name + ']\n' + ( // username or sharename
    '  path = ' + share.path + '\n') + // uuid path
    '  read only = no\n' + '  guest ok = no\n' + '  force user = root\n' + '  force group = root\n' + ('  valid users = ' + share.validUsers.join(', ') + '\n') + ( // valid users
    '  write list = ' + share.writelist.join(', ') + '\n') + // writelist
    '  vfs objects = full_audit\n' + '  full_audit:prefix = %u|%U|%S|%P\n' + '  full_audit:success = create_file mkdir rename rmdir unlink write pwrite \n' + // dont remove write !!!!
    '  full_audit:failure = connect\n' + '  full_audit:facility = LOCAL7\n' + '  full_audit:priority = ALERT\n\n';
  };

  var conf = global;
  shareList().forEach(function (share) {
    return conf += section(share);
  });
};

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

      debug(arr, audit);
    });

    _this.udp.on('close', function () {
      return console.log('smbaudit upd server closed');
    });
    return _this;
  }

  return SmbAudit;
}(_events2.default);

var startSamba = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var logConfigPath, logConfig, config;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            logConfigPath = '/etc/rsyslog.d/99-smbaudit.conf';
            logConfig = 'LOCAL7.*    @127.0.0.1:3721';

            // update rsyslog config if necessary

            config = null;
            _context3.prev = 3;
            _context3.next = 6;
            return _fs2.default.readFileAsync(logConfigPath);

          case 6:
            config = _context3.sent;
            _context3.next = 11;
            break;

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3['catch'](3);

          case 11:
            if (!(config !== logConfig)) {
              _context3.next = 16;
              break;
            }

            _context3.next = 14;
            return _fs2.default.writeFileAsync(logConfigPath, logConfig);

          case 14:
            _context3.next = 16;
            return _child_process2.default.execAsync('systemctl restart rsyslog');

          case 16:
            _context3.next = 18;
            return _child_process2.default.execAsync('systemctl start nmbd');

          case 18:
            _context3.next = 20;
            return _child_process2.default.execAsync('systemctl start smbd');

          case 20:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[3, 9]]);
  }));

  return function startSamba() {
    return _ref3.apply(this, arguments);
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
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4() {
    var udp;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return startSamba();

          case 2:
            _context4.next = 4;
            return (0, _bluebird.promisify)(createUdpServer)();

          case 4:
            udp = _context4.sent;
            return _context4.abrupt('return', new SmbAudit(udp));

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function createSmbAuditAsync() {
    return _ref4.apply(this, arguments);
  };
}();

/**
export const createSmbAudit = (callback) => {

  detectSamba(err => {
    if (err) return callback(err)

    detectRsyslog(err => {
      if (err) return callback(err)

      let udp = dgram.createSocket('udp4')
      udp.on('listening', () => 
        callback(null, new SmbAudit(udp))) 
     
      udp.once('error', err => 
        (err.code === 'EADDRINUSE') && callback(err)) 

      udp.bind(3721)
    })
  })
}
**/

var createSmbAudit = exports.createSmbAudit = function createSmbAudit(callback) {
  return createSmbAuditAsync().asCallback(callback);
};