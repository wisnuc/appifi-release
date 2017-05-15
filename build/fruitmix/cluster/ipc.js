'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _ipcHandler = require('ipcHandler');

var _ipcHandler2 = _interopRequireDefault(_ipcHandler);

var _ipcWorker = require('ipcWorker');

var _ipcWorker2 = _interopRequireDefault(_ipcWorker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ipc = _cluster2.default.isMaster ? (0, _ipcHandler2.default)() : (0, _ipcWorker2.default)();

exports.default = ipc;