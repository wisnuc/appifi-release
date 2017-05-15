'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

var _paths = require('./lib/paths');

var _paths2 = _interopRequireDefault(_paths);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import { createHttpServer } from '../fruitmix'

var createHttpServer = function createHttpServer() {

  //set upload paths root 
  _paths2.default.setRootAsync(_config2.default.path);

  var app = (0, _app2.default)();
  var server = void 0,
      port = 3721;
  app.set('port', port);

  server = _http2.default.createServer(app);
  server.timeout = 24 * 3600 * 1000; // 24 hours

  server.on('error', function (error) {

    if (error.syscall !== 'listen') {
      throw error;
    }

    // handle specific listen errors with friendly messages
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

  server.on('listening', function () {
    console.log('[fruitmix] Http Server Listening on Port ' + port);
  });

  server.on('close', function () {
    return console.log('[fruitmix] Http Server Closed');
  });

  server.listen(port);
};

exports.default = createHttpServer;