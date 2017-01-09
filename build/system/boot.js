'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fakeReboot = exports.tryBoot = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('../reducers');

var _storage = require('./storage');

var _fruitmix = require('../fruitmix/fruitmix');

var _docker = require('../appifi/docker');

var _docker2 = _interopRequireDefault(_docker);

var _adapter = require('./adapter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:boot');

var runnable = function runnable(wisnuc) {
  return (typeof wisnuc === 'undefined' ? 'undefined' : (0, _typeof3.default)(wisnuc)) === 'object' && wisnuc !== null && wisnuc.users;
};

//
// this function does not take any action
// it returns an object with following properties:
// 
// state: current boot state, 'maintenance', 'normal', 'alternative',
// error: if state is in maintenance, this explains why
// currentFileSystem: the file system in use for 'normal' or 'alternative'
//
// lastFileSystem: in config
// bootMode: in config
//
var bootState = function bootState(config, storage) {
  var bootMode = config.bootMode,
      lastFileSystem = config.lastFileSystem;
  var blocks = storage.blocks,
      volumes = storage.volumes;


  debug('bootState config, storage', config, storage);

  if (bootMode === 'maintenance') {

    debug('bootMode is set to maintenance by user');
    return {

      state: 'maintenance',
      bootMode: 'maintenance',
      error: 'config',

      currentFileSystem: null,
      lastFileSystem: lastFileSystem
    };
  }

  // find all file systems, including unmounted, missing, etc.
  var fileSystems = [].concat((0, _toConsumableArray3.default)(blocks.filter(function (blk) {
    return blk.isFileSystem && !blk.isVolumeDevice;
  })), (0, _toConsumableArray3.default)(volumes.filter(function (vol) {
    return vol.isFileSystem;
  })));

  // debug('tryBoot: all file systems', fileSystems)

  if (lastFileSystem) {

    var last = fileSystems.find(function (fsys) {
      return fsys.fileSystemType === lastFileSystem.type && fsys.fileSystemUUID === lastFileSystem.uuid;
    });

    if (last) {

      debug('last file system found', last);

      var error = null;
      if (!last.isMounted) {
        debug('last file system is not mounted');
        error = 'EMOUNTFAIL'; // TODO mountError
      } else if (last.isVolume && last.isMissing) {
        debug('last file system is volume and has missing device');
        error = 'EVOLUMEMISSING';
      } else if (!runnable(last.wisnuc)) {
        debug('not runnable', last);
        debug('last file system has no wisnuc installed');
        error = 'EWISNUCNOTFOUND';
      }

      var state = void 0,
          currentFileSystem = void 0;
      if (error) {
        state = 'maintenance', error, currentFileSystem = null;
      } else {
        debug('last file system ready to boot');
        state = 'normal', error, currentFileSystem = {
          type: last.fileSystemType,
          uuid: last.fileSystemUUID,
          mountpoint: last.mountpoint
        };
      }

      return { state: state, bootMode: bootMode, error: error, currentFileSystem: currentFileSystem, lastFileSystem: lastFileSystem };
    }
  }

  debug('no last fs in config or last fs not found');

  // no lfs or lfs not found, try alternative
  var alt = fileSystems.filter(function (fsys) {
    if (!fsys.isMounted) return false;
    if (fsys.isVolume && fsys.isMissing) return false;
    if (!runnable(fsys.wisnuc)) return false;
    return true;
  });

  debug('alternatives', alt);

  if (alt.length === 1) {
    return {
      state: 'alternative',
      bootMode: bootMode,
      error: null,
      currentFileSystem: {
        type: alt[0].fileSystemType,
        uuid: alt[0].fileSystemUUID,
        mountpoint: alt[0].mountpoint
      },
      lastFileSystem: lastFileSystem
    };
  } else {
    return {
      state: 'maintenance',
      bootMode: bootMode,
      error: alt.length === 0 ? 'ENOALT' : 'EMULTIALT',
      currentFileSystem: null,
      lastFileSystem: lastFileSystem
    };
  }
};

var tryBootAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var storage, adapted, probed, bstate, cfs, install, dockerRootDir;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _storage.refreshStorageAsync)();

          case 2:
            storage = _context.sent;
            adapted = (0, _adapter.adaptStorage)(storage);
            _context.next = 6;
            return (0, _adapter.probeAllFruitmixesAsync)(adapted);

          case 6:
            probed = _context.sent;
            bstate = bootState((0, _reducers.storeState)().config, probed);


            debug('tryboot: bootState', bstate);

            cfs = bstate.currentFileSystem;

            if (cfs) {

              // boot fruitmix
              debug('tryBoot, store, developer', (0, _reducers.storeState)().developer);

              if (!(0, _reducers.storeState)().developer.noFruitmix) {
                (0, _fruitmix.createFruitmix)(_path2.default.join(cfs.mountpoint, 'wisnuc', 'fruitmix'));
              } else {
                console.log('!!! fruitmix not started due to developer setting');
              }

              (0, _reducers.storeDispatch)({ type: 'CONFIG_LAST_FILESYSTEM', cfs: cfs });

              // boot appifi only if fruitmix booted
              install = (0, _reducers.storeState)().config.dockerInstall;

              debug('dockerInstall', install);

              dockerRootDir = _path2.default.join(cfs.mountpoint, 'wisnuc');

              _docker2.default.init(dockerRootDir);
            }

            (0, _reducers.storeDispatch)({ type: 'UPDATE_SYSBOOT', data: bstate });
            return _context.abrupt('return', bstate);

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function tryBootAsync() {
    return _ref.apply(this, arguments);
  };
}();

// try boot system
var tryBoot = exports.tryBoot = function tryBoot(callback) {
  return tryBootAsync().asCallback(callback);
};

var fakeReboot = exports.fakeReboot = function fakeReboot(lfs, callback) {
  (0, _reducers.storeDispatch)({
    type: 'CONFIG_LAST_FILESYSTEM',
    data: lfs
  });
  (0, _reducers.storeDispatch)({
    type: 'CONFIG_BOOT_MODE',
    data: 'normal'
  });
  tryBoot(callback);
};