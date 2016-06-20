'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');

var procSwaps = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var data;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new _promise2.default(function (resolve, reject) {
              return fs.readFile('/proc/swaps', function (err, data) {
                return err ? reject(err) : resolve(data);
              });
            });

          case 2:
            data = _context.sent;
            return _context.abrupt('return', data.toString().split(/\n/).filter(function (l) {
              return l.length;
            }).map(function (l) {
              return l.replace(/\t/g, ' ');
            }).filter(function (l) {
              return !l.startsWith('Filename');
            }).map(function (l) {
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
            }));

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));
  return function procSwaps() {
    return ref.apply(this, arguments);
  };
}();

module.exports = procSwaps;

// procSwaps().then((result) => console.log(result))