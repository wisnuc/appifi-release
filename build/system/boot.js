'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');
var child = require('child_process');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

var Developer = require('./developer');
var Config = require('./config');
var Storage = require('./storage');
var fruitmix = require('./boot/fruitmix');

var debug = require('debug')('system:boot');

var bootableFsTypes = ['btrfs', 'ext4', 'ntfs'];

var rimrafAsync = (0, _bluebird.promisify)(rimraf);
var mkdirpAsync = (0, _bluebird.promisify)(mkdirp);

/**
const decorateStorageAsync = async pretty => {

  let mps = [] 

  pretty.volumes.forEach(vol => {
    if (vol.isMounted && !vol.isMissing) mps.push({
      ref: vol,
      mp: vol.mountpoint
    })
  })

  pretty.blocks.forEach(blk => {
    if (!blk.isVolumeDevice && blk.isMounted && blk.isExt4)
      mps.push({
        ref: blk,
        mp: blk.mountpoint
      })
  })

  await Promise
    .map(mps, obj => fruitmix.probeAsync(obj.mp).reflect())
    .each((inspection, index) => {
      if (inspection.isFulfilled())
        mps[index].ref.wisnuc = inspection.value() 
      else {
        console.log(inspection.reason())
        mps[index].ref.wisnuc = 'ERROR'
      }
    })

  return pretty
}
**/

// extract file systems out of storage object
var extractFileSystems = function extractFileSystems(_ref) {
  var blocks = _ref.blocks,
      volumes = _ref.volumes;
  return [].concat((0, _toConsumableArray3.default)(blocks.filter(function (blk) {
    return blk.isFileSystem && !blk.isVolumeDevice;
  })), (0, _toConsumableArray3.default)(volumes.filter(function (vol) {
    return vol.isFileSystem;
  })));
};

// 
var shouldProbeFileSystem = function shouldProbeFileSystem(fsys) {
  return fsys.isVolume && fsys.isMounted && !fsys.isMissing || !fsys.isVolume && fsys.isMounted && (fsys.isExt4 || fsys.isNTFS);
};

// 
var probeAllAsync = function () {
  var _ref2 = (0, _bluebird.method)(function (fileSystems) {
    return (0, _bluebird.map)(fileSystems.filter(shouldProbeFileSystem), function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(fsys) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.prev = 0;
                _context.next = 3;
                return (0, _bluebird.resolve)(fruitmix.probeAsync(fsys.mountpoint));

              case 3:
                fsys.wisnuc = _context.sent;
                _context.next = 9;
                break;

              case 6:
                _context.prev = 6;
                _context.t0 = _context['catch'](0);

                fsys.wisnuc = { status: 'EFAIL' };

              case 9:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, undefined, [[0, 6]]);
      }));

      return function (_x2) {
        return _ref3.apply(this, arguments);
      };
    }());
  });

  return function probeAllAsync(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var throwError = function throwError(message) {
  throw new Error(message);
};

var assertFileSystemGood = function assertFileSystemGood(fsys) {
  return !bootableFsTypes.includes(fsys.fileSystemType) ? throwError('unsupported bootable type') : !fsys.isMounted ? throwError('file system is not mounted') : fsys.isVolume && fsys.isMissing ? throwError('file system has missing device') : true;
};

var assertReadyToBoot = function assertReadyToBoot(wisnuc) {
  return !wisnuc || (typeof wisnuc === 'undefined' ? 'undefined' : (0, _typeof3.default)(wisnuc)) !== 'object' || wisnuc.status !== 'READY' ? throwError('fruitmix status not READY') : true;
};

var assertReadyToInstall = function assertReadyToInstall(wisnuc) {
  return !wisnuc || (typeof wisnuc === 'undefined' ? 'undefined' : (0, _typeof3.default)(wisnuc)) !== 'object' || wisnuc.status !== 'ENOENT' ? throwError('fruitmix status not ENOENT') : true;
};

var shutdownAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(reboot) {
    var cmd;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            cmd = reboot === true ? 'reboot' : 'poweroff';
            _context2.next = 3;
            return (0, _bluebird.resolve)(child.execAsync('echo "PWR_LED 3" > /proc/BOARD_io').reflect());

          case 3:
            _context2.next = 5;
            return (0, _bluebird.resolve)((0, _bluebird.delay)(3000));

          case 5:
            _context2.next = 7;
            return (0, _bluebird.resolve)(child.execAsync(cmd));

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function shutdownAsync(_x3) {
    return _ref4.apply(this, arguments);
  };
}();

var cfs = function cfs(fsys) {
  return { type: fsys.fileSystemType, uuid: fsys.fileSystemUUID, mountpoint: fsys.mountpoint };
};

module.exports = {

  data: null,
  fruitmix: null,

  probedStorageAsync: function () {
    var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
      var storage, fileSystems;
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              storage = Storage.get();
              fileSystems = extractFileSystems(storage);
              _context3.next = 4;
              return (0, _bluebird.resolve)(probeAllAsync(fileSystems));

            case 4:
              return _context3.abrupt('return', storage);

            case 5:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, this);
    }));

    function probedStorageAsync() {
      return _ref5.apply(this, arguments);
    }

    return probedStorageAsync;
  }(),

  boot: function boot(cfs) {

    // maintenance mode does not need to start fruitmix
    if (Config.get().bootMode === 'normal') this.fruitmix = fruitmix.fork(cfs);

    // this.data = { state: 'normal', currentFileSystem: cfs }
    this.data = {
      state: Config.get().bootMode,
      currentFileSystem: cfs
    };
    Config.updateLastFileSystem({ type: cfs.type, uuid: cfs.uuid });
  },


  // autoboot
  autoBootAsync: function () {
    var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4() {
      var storage, fileSystems, last, type, uuid, fsys, alts;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return (0, _bluebird.resolve)(Storage.refreshAsync());

            case 2:
              storage = _context4.sent;
              fileSystems = extractFileSystems(storage);
              _context4.next = 6;
              return (0, _bluebird.resolve)(probeAllAsync(fileSystems));

            case 6:

              console.log('[autoboot] storage and fruitmix', (0, _stringify2.default)(storage, null, '  '));

              last = Config.get().lastFileSystem;

              if (!last) {
                _context4.next = 17;
                break;
              }

              type = last.type, uuid = last.uuid;
              fsys = fileSystems.find(function (f) {
                return f.fileSystemType === type && f.fileSystemUUID === uuid;
              });

              if (!fsys) {
                _context4.next = 15;
                break;
              }

              try {
                assertFileSystemGood(fsys);
                assertReadyToBoot(fsys.wisnuc);
                this.boot(cfs(fsys));
              } catch (e) {
                console.log('[autoboot] failed to boot lastfs', last, e);
                this.data = { state: 'maintenance', error: 'EFAIL', message: e.message };
              }
              console.log('[autoboot] boot state', this.data);
              return _context4.abrupt('return');

            case 15:
              _context4.next = 18;
              break;

            case 17:
              console.log('[autoboot] no lastfs');

            case 18:

              // find all good and ready-to-boot file systems
              alts = fileSystems.filter(function (f) {
                try {
                  assertFileSystemGood(f);
                  assertReadyToBoot(f.wisnuc);
                  return true;
                } catch (e) {
                  return false;
                }
              });


              if (alts.length === 1) this.boot(cfs(alts[0]));else this.data = { state: 'maintenance', error: alts.length === 0 ? 'ENOALT' : 'EMULTIALT' };

              console.log('[autoboot] boot state', this.data);

            case 21:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, this);
    }));

    function autoBootAsync() {
      return _ref6.apply(this, arguments);
    }

    return autoBootAsync;
  }(),

  // manual boot only occurs in maintenance mode.
  // this operation should not update boot state if failed.
  // target: file system UUID
  // username, password, if install is true or reinstall is true
  manualBootAsync: function () {
    var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(args) {
      var target, username, password, install, reinstall, storage, fileSystems, fsys, wisnuc;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              if (!(this.data.state !== 'maintenance')) {
                _context5.next = 2;
                break;
              }

              throw new Error('not in maintenance mode');

            case 2:
              target = args.target, username = args.username, password = args.password, install = args.install, reinstall = args.reinstall;
              _context5.next = 5;
              return (0, _bluebird.resolve)(Storage.refreshAsync());

            case 5:
              storage = _context5.sent;
              fileSystems = extractFileSystems(storage);
              fsys = fileSystems.find(function (f) {
                return f.uuid === target;
              });

              if (fsys) {
                _context5.next = 10;
                break;
              }

              throw (0, _assign2.default)(new Error('target not found'), { code: 'ENOENT' });

            case 10:

              assertFileSystemGood(fsys);
              _context5.next = 13;
              return (0, _bluebird.resolve)(fruitmix.probeAsync(fsys.mountpoint));

            case 13:
              wisnuc = _context5.sent;

              if (!(reinstall === true || install === true)) {
                _context5.next = 25;
                break;
              }

              if (!reinstall) {
                _context5.next = 22;
                break;
              }

              _context5.next = 18;
              return (0, _bluebird.resolve)(rimrafAsync(path.join(fsys.mountpoint, 'wisnuc')));

            case 18:
              _context5.next = 20;
              return (0, _bluebird.resolve)(mkdirpAsync(path.join(fsys.mountpoint, 'wisnuc', 'fruitmix')));

            case 20:
              _context5.next = 23;
              break;

            case 22:
              assertReadyToInstall(wisnuc);

            case 23:
              _context5.next = 26;
              break;

            case 25:
              // direct boot, fruitmix status must be 'READY'
              assertReadyToBoot(wisnuc);

            case 26:

              Config.merge({ bootMode: 'normal' });
              _context5.next = 29;
              return (0, _bluebird.resolve)((0, _bluebird.delay)(200));

            case 29:

              this.boot(cfs(fsys));

            case 30:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, this);
    }));

    function manualBootAsync(_x4) {
      return _ref7.apply(this, arguments);
    }

    return manualBootAsync;
  }(),

  // reboot
  rebootAsync: function () {
    var _ref8 = (0, _bluebird.method)(function (op, target) {

      switch (op) {
        case 'poweroff':
          shutdownAsync(false).asCallback(function () {});
          break;

        case 'reboot':
          shutdownAsync(true).asCallback(function () {});
          break;

        case 'rebootMaintenance':
          Config.updateBootMode('maintenance');
          shutdownAsync(true).asCallback(function () {});
          break;

        case 'rebootNormal':
          // should check bootability ??? TODO
          if (target) Config.updateLastFileSystem({ type: 'btrfs', uuid: target }, true);else Config.updateBootMode('normal');

          shutdownAsync(true).asCallback(function () {});
          break;

        default:
          throw new Error('unexpected case'); // TODO
      }
    });

    function rebootAsync(_x5, _x6) {
      return _ref8.apply(this, arguments);
    }

    return rebootAsync;
  }(),

  get: function get() {
    return this.data;
  }
};