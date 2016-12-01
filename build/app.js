'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _reducers = require('./reducers');

var _async = require('./common/async');

var _index = require('./system/index');

var _index2 = _interopRequireDefault(_index);

var _index3 = require('./appifi/index');

var _index4 = _interopRequireDefault(_index3);

var _device = require('./system/device');

var _device2 = _interopRequireDefault(_device);

var _barcelona = require('./system/barcelona');

var _boot = require('./system/boot');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:bootstrap');

var port = 3000;
var wisnucTmpDir = '/etc/wisnuc/tmp';
var wisnucConfigFile = '/etc/wisnuc.json';

var initConfig = function initConfig() {

  var state = undefined;

  (0, _reducers.storeSubscribe)(function () {

    if (state === (0, _reducers.storeState)().config) return;

    state = (0, _reducers.storeState)().config;
    (0, _async.writeObjectAsync)(wisnucConfigFile, wisnucTmpDir, state).asCallback(function (err) {
      debug('new config written', state);
      if (err) console.log('error writing config', err, state);
    });
  });

  _rimraf2.default.sync(wisnucTmpDir);
  _mkdirp2.default.sync(wisnucTmpDir);

  var raw = null;
  try {
    raw = _fs2.default.readFileSync(wisnucConfigFile, { encoding: 'utf8' });
  } catch (e) {
    console.log(e);
  }

  (0, _reducers.storeDispatch)({
    type: 'CONFIG_INIT',
    data: raw
  });
  console.log('[bootstrap] config initialized');
  console.log((0, _reducers.storeState)().config);
};

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
    console.log('[bootstrap] Listening on port ' + httpServer.address().port);
  });

  httpServer.listen(port);
};

process.argv.forEach(function (val, index, array) {
  if (val === '--appstore-master') {
    (0, _reducers.storeDispatch)({
      type: 'DEVELOPER_SETTING',
      key: 'appstoreMaster',
      value: true
    });
  }
});

// initialize config
initConfig();

(0, _device2.default)(function (err, data) {

  if (!err) {
    (0, _reducers.storeDispatch)({
      type: 'UPDATE_DEVICE',
      data: data
    });

    if (data.ws215i) {
      console.log('[bootstrap] device is ws215i');
      (0, _barcelona.barcelonaInit)();
    } else {
      console.log('[bootstrap] device is not ws215i');
    }
  }

  (0, _boot.tryBoot)(function (err) {

    if (err) {
      console.log('[bootstrap] failed to boot');
      console.log('==== die ====');
      console.log(err);
      console.log('==== die ====');
      process.exit(1);
      return;
    }

    startServer();
  });
});