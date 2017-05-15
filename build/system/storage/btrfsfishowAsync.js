'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');
var child = Promise.promisifyAll(require('child_process'));

/*
 * parse single volume info
 */
var btrfs_fi_show_uuid = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(uuid) {
    var stdout, lines, vol;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.resolve)(child.execAsync('btrfs fi show ' + uuid));

          case 2:
            stdout = _context.sent;
            lines = stdout.toString().split(/\n/).filter(function (l) {
              return l.length;
            }).map(function (l) {
              return l.trim();
            });
            vol = {
              missing: false,
              devices: []
            };


            lines.forEach(function (l) {

              if (l.startsWith('Label')) {
                // FIXME if label is none, this fails         
                if (l.startsWith('Label: none ')) {
                  vol.label = '';
                  var tmp = l.split(' ').filter(function (l) {
                    return l.length;
                  });
                  vol.uuid = tmp[tmp.length - 1];
                } else {
                  var opening = l.indexOf('\'');
                  var closing = l.lastIndexOf('\'');
                  vol.label = l.slice(opening + 1, closing);
                  var _tmp = l.split(' ');
                  vol.uuid = _tmp[_tmp.length - 1]; // last one
                }
              } else if (l.startsWith('Total')) {
                var _tmp2 = l.split(' ');
                vol.total = parseInt(_tmp2[2]);
                vol.used = _tmp2[6];
              } else if (l.startsWith('devid')) {
                var _tmp3 = l.split(' ').filter(function (l) {
                  return l.length;
                });
                vol.devices.push({
                  id: parseInt(_tmp3[1]),
                  size: _tmp3[3],
                  used: _tmp3[5],
                  path: _tmp3[7]
                });
              }
              // FIXME warning devid 2 not found already (not sure stdout or stderr)
              // FIXME also, the error message won't print if volume mounted
              // warning, device 2 is missing
              else if (l.startsWith('warning, device')) {
                  var _tmp4 = l.split(' ');
                  vol.devices.push({
                    id: parseInt(_tmp4[2])
                  });
                } else if (l.startsWith('*** Some devices missing')) {
                  vol.missing = true;
                } else {
                  console.log('unexpected behavior');
                  console.log('----');
                  console.log(l);
                  console.log('----');
                }
            });

            // sort devices by id
            vol.devices.sort(function (a, b) {
              return a.id - b.id;
            });
            return _context.abrupt('return', vol);

          case 8:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function btrfs_fi_show_uuid(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
  var cmd, stdout, uuids;
  return _regenerator2.default.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          cmd = 'btrfs fi show | grep -P \'^Label: \' | sed -n -e \'s/^.*uuid: //p\'';

          // FIXME btrfs fi show returns success exit code and nothing if not root

          _context2.next = 3;
          return (0, _bluebird.resolve)(child.execAsync(cmd));

        case 3:
          stdout = _context2.sent;
          uuids = stdout.toString().split(/\n/).filter(function (l) {
            return l.length;
          });
          return _context2.abrupt('return', Promise.map(uuids, function (uuid) {
            return btrfs_fi_show_uuid(uuid);
          }));

        case 6:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, undefined);
}));