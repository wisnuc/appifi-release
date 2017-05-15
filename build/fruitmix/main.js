'use strict';

var _config = require('./cluster/config');

var _config2 = _interopRequireDefault(_config);

var _master = require('./cluster/master');

var _master2 = _interopRequireDefault(_master);

var _worker = require('./cluster/worker');

var _worker2 = _interopRequireDefault(_worker);

var _ipcHandler = require('./cluster/ipcHandler');

var _ipcHandler2 = _interopRequireDefault(_ipcHandler);

var _ipcWorker = require('./cluster/ipcWorker');

var _ipcWorker2 = _interopRequireDefault(_ipcWorker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var cluster = require('cluster');
var os = require('os');

// check fruitmix path
if (typeof _config2.default.path !== 'string' || _config2.default.path.length === 0) {
  console.log('fruitmix root path not set');
  process.exit(1);
} else if (!path.isAbsolute(_config2.default.path)) {
  try {
    _config2.default.path = path.resolve(_config2.default.path);
  } catch (e) {
    console.log('failed to resolve fruitmix path');
    process.exit(1);
  }
}

if (cluster.isMaster) {

  console.log('Master ' + process.pid + ' is running');
  console.log('fruitmix path is set to ' + _config2.default.path);

  var numCPUs = os.cpus().length;

  var _loop = function _loop(i) {
    var worker = cluster.fork();
    worker.on('message', function (msg) {
      return _config2.default.ipc.handle(worker, msg);
    });
  };

  for (var i = 0; i < numCPUs; i++) {
    _loop(i);
  }

  cluster.on('exit', function (worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });

  _config2.default.ipc = (0, _ipcHandler2.default)();
  (0, _master2.default)().asCallback(function (err) {

    if (err) {
      console.log('fruitmix master failed to start, exit', err);
      process.exit(1);
    }
  });
} else {
  console.log('Worker ' + process.pid + ' started');
  _config2.default.ipc = (0, _ipcWorker2.default)();
  (0, _worker2.default)();
  _config2.default.ipc.call('fruitmixStart', {}, function () {});
}