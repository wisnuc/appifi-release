'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createHttpServer = exports.createFruitmix = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _dgram = require('dgram');

var _dgram2 = _interopRequireDefault(_dgram);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('../reducers');

var _system = require('./lib/system');

var _system2 = _interopRequireDefault(_system);

var _models = require('./models/models');

var _models2 = _interopRequireDefault(_models);

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import { createSmbAudit } from './lib/samba'

var debug = (0, _debug2.default)('fruitmix:fruitmix');

// Promise.promisifyAll(child)

// const startSamba = async () => {
//   child.execAsync('systemctl start nmbd'),
//   child.execAsync('systemctl start smbd')
// }

// class Fruitmix extends EventEmitter {

//   constructor(system, app, server, smbAudit) {

//     super()
//     this.system = system
//     this.app = app
//     this.server = server 
//     this.smbAudit = smbAudit
//   }
// }

// TODO

// import EventEmitter from 'events'

// import child from 'child_process'
var createHttpServer = function createHttpServer(app, callback) {

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
    callback();
  });
  server.on('close', function () {
    return console.log('[fruitmix] Http Server Closed');
  });
  server.listen(port);
};

var createFruitmixAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(sysroot) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.resolve)(_system2.default.initAsync(sysroot));

          case 2:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createFruitmixAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

var createFruitmix = function createFruitmix(sysroot, callback) {
  return createFruitmixAsync(sysroot).asCallback(function (err) {
    return callback && callback(err);
  });
};

exports.createFruitmix = createFruitmix;
exports.createHttpServer = createHttpServer;