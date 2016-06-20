"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delay = exports.toLines = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var delay = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(duration) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new _promise2.default(function (resolve) {
              // reject not used
              setTimeout(function () {
                resolve();
              }, duration);
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function delay(_x) {
    return ref.apply(this, arguments);
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