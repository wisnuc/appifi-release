"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delay = exports.toLines = undefined;

var _bluebird = require("bluebird");

var _bluebird2 = _interopRequireDefault(_bluebird);

var delay = function () {
  var _ref = (0, _bluebird.method)(function (duration) {

    return new _bluebird2.default(function (resolve) {
      // reject not used
      setTimeout(function () {
        resolve();
      }, duration);
    });
  });

  return function delay(_x) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toLines(output) {
  return output.toString().split(/\n/).filter(function (l) {
    return l.length;
  }).map(function (l) {
    return l.trim();
  });
}

exports.toLines = toLines;
exports.delay = delay;