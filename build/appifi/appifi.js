'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var http = require('http');
var app = require('./index');
var port = 3000;

// inject (piggyback) system api
module.exports = function (system) {

  app.use('/system', system);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    return next((0, _assign2.default)(new Error('Not Found'), { status: 404 }));
  });

  // development error handler will print stacktrace
  if (app.get('env') === 'development') {
    app.use(function (err, req, res) {
      return res.status(err.status || 500).send('error: ' + err.message);
    });
  }

  // production error handler no stacktraces leaked to user
  app.use(function (err, req, res) {
    return res.status(err.status || 500).send('error: ' + err.message);
  });

  app.set('port', port);

  var httpServer = http.createServer(app);

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
    console.log('[appifi] server listening on port ' + httpServer.address().port);
  });

  httpServer.listen(port);
};