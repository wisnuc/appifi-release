'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var btrfs_filesystem_usage = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(mountpoint) {
    var tmp, cmd, stdout, result, o, filling;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            tmp = void 0, cmd = 'btrfs filesystem usage -b ' + mountpoint;
            _context.next = 3;
            return new _bluebird2.default(function (resolve, reject) {
              return child.exec(cmd, function (err, stdout) {
                return (// stderr not used
                  err ? reject(err) : resolve(stdout)
                );
              });
            });

          case 3:
            stdout = _context.sent;
            result = {
              mountpoint: mountpoint,
              overall: {},
              data: { devices: [] },
              metadata: { devices: [] },
              system: { devices: [] },
              unallocated: { devices: [] }
            };
            o = result.overall;
            filling = null;


            stdout.toString().split(/\n\n/).forEach(function (sec) {
              if (sec.startsWith('Overall')) {
                sec.split(/\n/).filter(function (l) {
                  return l.startsWith('  ');
                }).map(function (l) {
                  return l.replace(/\t+/, ' ').trim();
                }).forEach(function (l) {

                  var tmp = l.split(': ').map(function (s) {
                    return s.trim();
                  });

                  if (tmp[0] === 'Device size') {
                    o.deviceSize = parseInt(tmp[1]);
                  } else if (tmp[0] === 'Device allocated') {
                    o.deviceAllocated = parseInt(tmp[1]);
                  } else if (tmp[0] === 'Device unallocated') {
                    o.deviceUnallocated = parseInt(tmp[1]);
                  } else if (tmp[0] === 'Device missing') {
                    o.deviceMissing = parseInt(tmp[1]);
                  } else if (tmp[0] === 'Used') {
                    o.used = parseInt(tmp[1]);
                  } else if (tmp[0] === 'Free (estimated)') {
                    o.free = parseInt(tmp[1]);
                    o.freeMin = parseInt(tmp[2]);
                  } else if (tmp[0] === 'Data ratio') {
                    o.dataRatio = tmp[1];
                  } else if (tmp[0] === 'Metadata ratio') {
                    o.metadataRatio = tmp[1];
                  } else if (tmp[0] === 'Global reserve') {
                    o.globalReserve = parseInt(tmp[1]);
                    o.globalReserveUsed = parseInt(tmp[2]);
                  }
                  // else { TODO
                  // }
                });
              } else {
                sec.split(/\n/).filter(function (l) {
                  return l.length;
                }).forEach(function (l) {
                  if (l.startsWith('Data') || l.startsWith('Metadata') || l.startsWith('System') || l.startsWith('Unallocated')) {

                    tmp = l.split(' ').filter(function (l) {
                      return l.length;
                    });

                    if (l.startsWith('Data')) {
                      result.data.mode = tmp[0].slice(5, -1);
                      result.data.size = parseInt(tmp[1].slice(5, -1));
                      result.data.used = parseInt(tmp[2].slice(5));
                      filling = 'data';
                    } else if (l.startsWith('Metadata')) {
                      result.metadata.mode = tmp[0].slice(9, -1);
                      result.metadata.size = parseInt(tmp[1].slice(5, -1));
                      result.metadata.used = parseInt(tmp[2].slice(5));
                      filling = 'metadata';
                    } else if (l.startsWith('System')) {
                      result.system.mode = tmp[0].slice(7, -1);
                      result.system.size = parseInt(tmp[1].slice(5, -1));
                      result.system.used = parseInt(tmp[2].slice(5));
                      filling = 'system';
                    } else if (l.startsWith('Unallocated')) {
                      filling = 'unallocated';
                    }
                  } else {
                    tmp = l.replace(/\t+/, ' ').split(' ').filter(function (l) {
                      return l.length;
                    });
                    if (tmp[0].startsWith('/dev/')) {
                      result[filling].devices[tmp[0]] = tmp[1];
                    }
                  }
                });
              }
            });
            return _context.abrupt('return', result);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function btrfs_filesystem_usage(_x) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var child = require('child_process');

var btrfs_device_usage = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(mountpoint) {
    var cmd, stdout, lines, result, dev;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            cmd = 'btrfs device usage -b ' + mountpoint;
            _context2.next = 3;
            return new _bluebird2.default(function (resolve, reject) {
              return child.exec(cmd, function (err, stdout) {
                return (// stderr not used
                  err ? reject(err) : resolve(stdout)
                );
              });
            });

          case 3:
            stdout = _context2.sent;
            lines = stdout.toString().split(/\n/).map(function (l) {
              return l.trim();
            }).filter(function (l) {
              return l.length;
            });
            result = [];
            dev = null;


            lines.forEach(function (l) {
              var tmp = l.split(' ').filter(function (l) {
                return l.length;
              });
              if (l.startsWith('/dev')) {
                if (dev) result.push(dev);
                dev = { data: {}, metadata: {}, system: {} };
                dev.name = tmp[0].slice(0, -1);
                dev.id = parseInt(tmp[2]);
              } else if (l.startsWith('Device size')) {
                dev.size = parseInt(tmp[2]);
              } else if (l.startsWith('Data')) {
                dev.data.mode = tmp[0].slice(5, -1);
                dev.data.size = parseInt(tmp[1]);
              } else if (l.startsWith('Metadata')) {
                dev.metadata.mode = tmp[0].slice(9, -1);
                dev.metadata.size = parseInt(tmp[1]);
              } else if (l.startsWith('System')) {
                dev.system.mode = tmp[0].slice(7, -1);
                dev.system.size = parseInt(tmp[1]);
              } else if (l.startsWith('Unallocated')) {
                dev.unallocated = parseInt(tmp[1]);
              }
            });

            if (dev) result.push(dev);
            return _context2.abrupt('return', result);

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function btrfs_device_usage(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var btrfs_usage = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(mountpoint) {
    var usage;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _bluebird.all)([btrfs_filesystem_usage(mountpoint), btrfs_device_usage(mountpoint)]);

          case 2:
            usage = _context3.sent;
            return _context3.abrupt('return', (0, _assign2.default)({}, usage[0], { devices: usage[1] }));

          case 4:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function btrfs_usage(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

module.exports = btrfs_usage;

// btrfs_usage('/run/wisnuc/volumes/79575a8e-673f-4d00-92ee-c338023ec754').then((result) => console.log(result))