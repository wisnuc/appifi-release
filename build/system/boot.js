'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryBoot = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _storage = require('../appifi/lib/storage');

var _appifi = require('../appifi/appifi');

var _appifi2 = _interopRequireDefault(_appifi);

var _fruitmix = require('../fruitmix/fruitmix');

var _reducers = require('../appifi/lib/reducers');

var _sysconfig = require('./sysconfig');

var _sysconfig2 = _interopRequireDefault(_sysconfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:boot');

var bootState = function bootState() {

  var bootMode = _sysconfig2.default.get('bootMode');
  var lastFileSystem = _sysconfig2.default.get('lastFileSystem');
  var _storeState$storage = (0, _reducers.storeState)().storage,
      blocks = _storeState$storage.blocks,
      volumes = _storeState$storage.volumes;


  if (bootMode === 'maintenance') {

    debug('bootMode is set maintenance by user');
    return {
      state: 'maintenance',
      bootMode: 'maintenance',
      error: null,
      currentFileSystem: null,
      lastFileSystem: lastFileSystem
    };
  }

  // find all file systems, including unmounted, missing, etc.
  var fileSystems = [].concat((0, _toConsumableArray3.default)(blocks.filter(function (blk) {
    return blk.stats.isFileSystem && !blk.stats.isVolume;
  })), (0, _toConsumableArray3.default)(volumes.filter(function (vol) {
    return vol.stats.isFileSystem;
  })));

  // debug('tryBoot: all file systems', fileSystems)

  if (lastFileSystem) {

    var last = fileSystems.find(function (fsys) {
      return fsys.stats.fileSystemType === lastFileSystem.type && fsys.stats.fileSystemUUID === lastFileSystem.uuid;
    });

    if (last) {

      debug('last file system found', last);

      var error = null;
      if (!last.stats.isMounted) {
        debug('last file system is not mounted');
        error = 'EMOUNTFAIL';
      } else if (last.stats.isVolume && last.stats.isMissing) {
        debug('last file system is volume and has missing device');
        error = 'EVOLUMEMISSING';
      } else if (!last.stats.wisnucInstalled) {
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
          type: last.stats.fileSystemType,
          uuid: last.stats.fileSystemUUID,
          mountpoint: last.stats.mountpoint
        };
      }

      return { state: state, bootMode: bootMode, error: error, currentFileSystem: currentFileSystem, lastFileSystem: lastFileSystem };
    }
  }

  debug('no last fs in config or last fs not found');

  // no lfs or lfs not found, try alternative
  var alt = fileSystems.filter(function (fsys) {
    return fsys.stats.isMounted && (fsys.stats.isVolume ? !fsys.stats.isMissing : true) && fsys.stats.wisnucInstalled;
  });

  debug('alternatives', alt);

  if (alt.length === 1) {
    return {
      state: 'alternative',
      bootMode: bootMode,
      error: null,
      currentFileSystem: {
        type: alt[0].stats.fileSystemType,
        uuid: alt[0].stats.fileSystemUUID,
        mountpoint: alt[0].stats.mountpoint
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

var tryBoot = exports.tryBoot = function tryBoot(callback) {
  (0, _storage.refreshStorage)().asCallback(function (err) {
    if (err) return callback(err);

    var bstate = bootState();

    debug('tryboot: bootState', bstate);

    var cfs = bstate.currentFileSystem;
    if (cfs) {

      (0, _appifi2.default)();
      (0, _fruitmix.createFruitmix)(_path2.default.join(cfs.mountpoint, 'wisnuc', 'fruitmix'));
      _sysconfig2.default.set('lastFileSystem', cfs);
    }

    (0, _reducers.storeDispatch)({ type: 'UPDATE_SYSBOOT', data: bstate });
    callback();
  });
};