'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (callback) {
  return _child_process2.default.exec('timedatectl', function (err, stdout, stderr) {
    return err ? callback(err) : callback(null, stdout.toString().split('\n').filter(function (l) {
      return l.length;
    }).reduce(function (prev, curr) {
      var pair = curr.split(': ').map(function (str) {
        return str.trim();
      });
      prev[pair[0]] = pair[1];
      return prev;
    }, {}));
  });
};