'use strict';

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

(0, _storage.refreshStorage)().asCallback(function (err) {

  if (err) {
    console.log('failed to init storage, exit');
    console.log(err);
    process.exit(1);
  }

  var fileSystem = null;
  var mountpoint = null;

  // load config
  var lastFileSystem = _sysconfig2.default.get('lastFileSystem');

  debug('sysconfig', _sysconfig2.default);
  debug('lastFileSystem', lastFileSystem);

  var state = void 0;
  var currentFileSystem = null;
  var bootMode = _sysconfig2.default.get('bootMode');
  debug('bootMode', bootMode);

  if (bootMode === 'maintenance') {
    // enter maintenance mode by user setting
    state = 'maintenance';
    // clear one-shot config
    _sysconfig2.default.set('bootMode', 'normal');
  } else {
    // normal mode

    // find all file system mounted
    var mounted = (0, _storage.mountedFS)((0, _reducers.storeState)().storage);

    if (lastFileSystem) {

      fileSystem = mounted.find(function (x) {
        return x.stats.fileSystemType === lastFileSystem.type && x.stats.fileSystemUUID === lastFileSystem.uuid;
      });

      if (fileSystem) debug('lastFileSystem found', fileSystem);
    }

    if (fileSystem) {// fileSystem found

    } else {
      // no lastFileSystem or corresponding file system not found

      var installed = mounted.filter(function (mfs) {
        return mfs.stats.wisnucInstalled;
      });
      if (installed.length == 1) {
        // only one
        fileSystem = installed[0];
      }
    }

    // Not checked ... TODO
    if (fileSystem) {

      state = 'normal';
      currentFileSystem = {
        type: fileSystem.stats.fileSystemType,
        uuid: fileSystem.stats.fileSystemUUID,
        mountpoint: fileSystem.stats.mountpoint
      };

      debug('set currentFileSystem', fileSystem, currentFileSystem);

      (0, _appifi2.default)();
      (0, _fruitmix.createFruitmix)(_path2.default.join(currentFileSystem.mountpoint, 'wisnuc', 'fruitmix'));
      _sysconfig2.default.set('lastFileSystem', currentFileSystem);
    } else {

      state = 'maintenance';
    }
  }

  // update store state
  var actionData = {
    state: state,
    bootMode: bootMode,
    lastFileSystem: lastFileSystem,
    currentFileSystem: currentFileSystem
  };
  (0, _reducers.storeDispatch)({ type: 'UPDATE_SYSBOOT', data: actionData });

  // log
  console.log('[app] updating sysboot', actionData);

  startServer();
});