'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');

var procMounts = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    var data, lines, all, filtered;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new _promise2.default(function (resolve, reject) {
              return fs.readFile('/proc/mounts', function (err, data) {
                return err ? reject(err) : resolve(data);
              });
            });

          case 2:
            data = _context.sent;
            lines = data.toString().split(/\n/).filter(function (l) {
              return l.length;
            });
            all = lines.map(function (l) {
              var tmp = l.split(' ');
              return {
                device: tmp[0],
                mountpoint: tmp[1],
                fs_type: tmp[2],
                opts: tmp[3].split(',')
              };
            });
            filtered = all.filter(function (m) {
              return m.device.startsWith('/dev/sd') || m.device.startsWith('/dev/mmc');
            });
            return _context.abrupt('return', filtered);

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));
  return function procMounts() {
    return ref.apply(this, arguments);
  };
}();

module.exports = procMounts;

// procMounts().then((result) => console.log(result))