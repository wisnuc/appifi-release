'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var http = require('http');
var app = require('express')();
var logger = require('morgan');
var bodyParser = require('body-parser');

module.exports = function (system) {

  var port = 3000;

  app.use(logger('dev', { skip: function skip(req, res) {
      return res.nolog === true;
    } }));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.set('json spaces', 2);

  // mute polling
  app.get('/server', function (req, res) {
    return (res.nolog = true) && res.status(404).end();
  });

  app.use('/system', system);

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    return next((0, _assign2.default)(new Error('Not Found'), { status: 404 }));
  });
  // final catch ??? TODO
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
    console.log('[system] server listening on port ' + httpServer.address().port);
  });

  httpServer.listen(port);
};