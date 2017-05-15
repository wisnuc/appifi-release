'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

exports.default = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
  return _regenerator2.default.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return (0, _bluebird.resolve)(fs.readFileAsync('/proc/swaps'));

        case 2:
          _context.t0 = function (l) {
            return l.length;
          };

          _context.t1 = function (l) {
            return l.replace(/\t/g, ' ');
          };

          _context.t2 = function (l) {
            return !l.startsWith('Filename');
          };

          _context.t3 = function (l) {
            var tmp = l.split(' ').filter(function (l) {
              return l.length;
            });
            return {
              filename: tmp[0],
              type: tmp[1],
              size: tmp[2],
              used: tmp[3],
              priority: tmp[4]
            };
          };

          return _context.abrupt('return', _context.sent.toString().split(/\n/).filter(_context.t0).map(_context.t1).filter(_context.t2).map(_context.t3));

        case 7:
        case 'end':
          return _context.stop();
      }
    }
  }, _callee, undefined);
}));