'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// cmd must be a string
// args must be a string array
var command = function command(cmd, args, callback) {

  var output = void 0,
      h = void 0,
      finished = false;

  var finalize = function finalize() {
    return finished = h && h.kill() || true;
  };
  var error = function error(err) {
    return finalize() && callback(err);
  };
  var finish = function finish(data) {
    return finalize() && callback(null, data);
  };

  h = _child_process2.default.spawn(cmd, args);
  h.stdout.on('data', function (data) {
    return !finished && (output = data);
  });
  h.on('close', function (code, signal) {
    return finished ? undefined : signal ? error(new _error2.default.EEXITSIGNAL('exit with signal ' + signal)) : code !== 0 ? error(new _error2.default.EEXITCODE('exit with code ' + code)) : finish(output.toString());
  });

  return function () {
    return !finished && error(new _error2.default.EABORT());
  };
};

exports.default = command;