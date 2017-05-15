'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// this module implements a command pattern over ipc

/**
 * job :{
 *  id,
 *  op,
 *  args,
 *  timestamp,
 *  callback
 * }
 */
var jobs = [];

var Job = function () {
  function Job(op, args, callback) {
    (0, _classCallCheck3.default)(this, Job);

    this.id = _nodeUuid2.default.v4();
    this.op = op;
    this.args = args;
    this.callback = callback;
    this.timestamp = new Date().getTime();
  }

  (0, _createClass3.default)(Job, [{
    key: 'message',
    value: function message() {
      return {
        type: 'command',
        id: this.id,
        op: this.op,
        args: this.args
      };
    }
  }]);
  return Job;
}();

var IpcWorker = function () {
  function IpcWorker() {
    (0, _classCallCheck3.default)(this, IpcWorker);

    this.jobs = [];
  }

  (0, _createClass3.default)(IpcWorker, [{
    key: 'createJob',
    value: function createJob(op, args, callback) {
      var job = new Job(op, args, callback);
      jobs.push(job);
      return job;
    }
  }, {
    key: 'call',
    value: function call(op, args, callback) {

      // change to debug TODO
      // console.log('ipc call', op, args)

      var job = void 0;
      try {
        job = this.createJob(op, args, callback);
      } catch (e) {
        process.nextTick(function () {
          return callback(e);
        });
        return;
      }

      process.send(job.message());
    }
  }, {
    key: 'handleCommandMessage',
    value: function handleCommandMessage(msg) {
      var id = msg.id,
          data = msg.data,
          err = msg.err;

      var index = jobs.findIndex(function (job) {
        return job.id === id;
      });

      if (index !== -1) {
        var job = jobs[index];
        jobs.splice(index, 1);
        job.callback(err ? err : null, data);
      } else {
        console.log('job not found' + msg);
      }
    }
  }]);
  return IpcWorker;
}();

var createIpcWorker = function createIpcWorker() {

  var ipc = new IpcWorker();

  process.on('message', function (msg) {

    // console.log('ipcworker, msg', msg)

    switch (msg.type) {
      case 'command':
        ipc.handleCommandMessage(msg);
        break;
      default:
        break;
    }
  });

  return ipc;
};

exports.default = createIpcWorker;