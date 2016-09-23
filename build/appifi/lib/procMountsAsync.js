'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');

var procMounts = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var data, lines, all, filtered;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return new _bluebird2.default(function (resolve, reject) {
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
    return _ref.apply(this, arguments);
  };
}();

module.exports = procMounts;

// procMounts().then((result) => console.log(result))