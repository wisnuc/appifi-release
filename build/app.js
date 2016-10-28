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

var _boot = require('./system/boot');

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

(0, _boot.tryBoot)(function (err) {

  if (err) {
    console.log('[app] failed to boot');
    console.log('==== die ====');
    console.log(err);
    console.log('==== die ====');
    process.exit(1);
    return;
  }

  startServer();
});