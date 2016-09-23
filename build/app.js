'use strict';

var _reducers = require('./appifi/lib/reducers');

var _appifiConfig = require('./appifi/lib/appifiConfig');

var _barcelona = require('./appifi/lib/barcelona');

var _server = require('./appifi/lib/server');

var _server2 = _interopRequireDefault(_server);

var _appstore = require('./appifi/lib/appstore');

var _appstore2 = _interopRequireDefault(_appstore);

var _docker = require('./appifi/lib/docker');

var _docker2 = _interopRequireDefault(_docker);

var _storage = require('./appifi/lib/storage');

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var express = require('express');
// var favicon = require('serve-favicon')
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

/*
 * middlewares
 */
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev', {
  skip: function skip(req) {
    // console.log(`morgan: ${req.path}`)
    if (req.path === '/status') return true;
    return false;
  }
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

/*
 * module init
 */


process.argv.forEach(function (val, index, array) {
  if (val === '--appstore-master') {
    (0, _reducers.storeDispatch)({
      type: 'SERVER_CONFIG',
      key: 'appstoreMaster',
      value: true
    });
  }
});

(0, _appifiConfig.initConfig)();

// code for barcelona, harmless for other platfrom
(0, _barcelona.updateFanSpeed)();
(0, _barcelona.pollingPowerButton)();
(0, _barcelona.setFanScale)((0, _appifiConfig.getConfig)('barcelonaFanScale'));

_storage2.default.init();
_docker2.default.init();
_appstore2.default.reload();

/*
 * routes
 */
app.use('/', require('./appifi/routes/index'));
app.use('/appstore', require('./appifi/routes/appstore'));
app.use('/server', require('./appifi/routes/server'));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res) {
    res.status(err.status || 500);
    res.send('error: ' + err.message);
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res) {
  res.status(err.status || 500);
  res.send('error: ' + err.message);
});

// module.exports = app

/**
 * Module dependencies.
 */

// var app = require('../app');
var debug = require('debug')('appifi:server');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var httpServer = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

httpServer.listen(port);
httpServer.on('error', onError);
httpServer.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = httpServer.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

process.on('unhandledRejection', function (reason, p) {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});