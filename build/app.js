'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _sysinit = require('./system/sysinit');

var _sysinit2 = _interopRequireDefault(_sysinit);

var _sysconfig = require('./system/sysconfig');

var _sysconfig2 = _interopRequireDefault(_sysconfig);

var _reducers = require('./appifi/lib/reducers');

var _storage = require('./appifi/lib/storage');

var _storage2 = _interopRequireDefault(_storage);

var _index = require('./system/index');

var _index2 = _interopRequireDefault(_index);

var _appifi = require('./appifi/appifi');

var _appifi2 = _interopRequireDefault(_appifi);

var _index3 = require('./appifi/index');

var _index4 = _interopRequireDefault(_index3);

var _fruitmix = require('./fruitmix/fruitmix');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:bootstrap');

var port = 3000;

// append (piggyback) system api
var startServer = function startServer() {

  _index4.default.use('/system', _index2.default);

  // catch 404 and forward to error handler
  _index4.default.use(function (req, res, next) {
    return next((0, _assign2.default)(new Error('Not Found'), { status: 404 }));
  });

  // development error handler will print stacktrace
  if (_index4.default.get('env') === 'development') {
    _index4.default.use(function (err, req, res) {
      return res.status(err.status || 500).send('error: ' + err.message);
    });
  }

  // production error handler no stacktraces leaked to user
  _index4.default.use(function (err, req, res) {
    return res.status(err.status || 500).send('error: ' + err.message);
  });

  _index4.default.set('port', port);

  var httpServer = _http2.default.createServer(_index4.default);

  httpServer.on('error', function (error) {

    if (error.syscall !== 'listen') throw error;
    switch (error.code) {
      case 'EACCES':
        console.error('Port ' + port + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error('Port ' + port + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });

  httpServer.on('listening', function () {
    console.log('[app] Listening on port ' + httpServer.address().port);
  });

  httpServer.listen(port);
};

process.argv.forEach(function (val, index, array) {
  if (val === '--appstore-master') {
    (0, _reducers.storeDispatch)({
      type: 'SERVER_CONFIG',
      key: 'appstoreMaster',
      value: true
    });
  }
});

var tryBoot = function tryBoot() {

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

  debug('tryBoot: all file systems', fileSystems);

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
          _currentFileSystem = void 0;
      if (err) {
        state = 'maintenance', error, _currentFileSystem = null;
      } else {
        debug('last file system ready to boot');
        state = 'normal', error, _currentFileSystem = {
          type: last.stats.fileSystemType,
          uuid: last.stats.fileSystemUUID,
          mountpoint: last.stats.mountpoint
        };
      }

      return { state: state, bootMode: bootMode, error: error, currentFileSystem: _currentFileSystem, lastFileSystem: lastFileSystem };
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

(0, _storage.refreshStorage)().asCallback(function (err) {

  if (err) {
    console.log('[app] failed to init storage, exit');
    console.log(err);
    process.exit(1);
  }

  console.log('[app] updating sysboot', boot);

  var boot = tryBoot();
  if (boot.currentFileSystem) {

    console.log('boot current file system');

    (0, _appifi2.default)();
    (0, _fruitmix.createFruitmix)(_path2.default.join(currentFileSystem.mountpoint, 'wisnuc', 'fruitmix'));
    _sysconfig2.default.set('lastFileSystem', currentFileSystem);
  } else {
    console.log('no current file system, boot into maintenance mode');
  }

  (0, _reducers.storeDispatch)({ type: 'UPDATE_SYSBOOT', data: boot });
  startServer();
});