'use strict';

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');
var child = require('child_process');

var barcelona = require('./barcelona');

// K combinator
var K = function K(x) {
  return function (y) {
    return x;
  };
};

var dminames = ['bios-vendor', 'bios-version', 'bios-release-date', 'system-manufacturer', 'system-product-name', 'system-version', 'system-serial-number', 'system-uuid', 'baseboard-manufacturer', 'baseboard-product-name', 'baseboard-version', 'baseboard-serial-number', 'baseboard-asset-tag', 'chassis-manufacturer', 'chassis-type', 'chassis-version', 'chassis-serial-number', 'chassis-asset-tag', 'processor-family', 'processor-manufacturer', 'processor-version', 'processor-frequency'];

// this function change string format 'processor-family' to js style 'processorFamily'
var camelCase = function camelCase(text) {
  return text.split(/[_\- ()]/).map(function (w, idx) {
    return idx === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
};

// parse
var parseSingleSectionOutput = function parseSingleSectionOutput(stdout) {
  return stdout.toString().split('\n') // split to lines
  .map(function (l) {
    return l.trim();
  }).filter(function (l) {
    return l.length;
  }) // trim and remove empty line
  .map(function (l) {
    return l.split(':').map(function (w) {
      return w.trim();
    });
  }) // split to word array (kv)
  .filter(function (arr) {
    return arr.length === 2 && arr[0].length;
  }) // filter out non-kv
  .reduce(function (obj, arr) {
    return K(obj)(obj[camelCase(arr[0])] = arr[1]);
  }, {});
}; // merge into one object

// parse
var parseMultiSectionOutput = function parseMultiSectionOutput(stdout) {
  return stdout.toString().split('\n\n') // split to sections
  .map(function (sect) {
    return sect.trim();
  }) // trim
  .filter(function (sect) {
    return sect.length;
  }) // remove last empty
  .map(function (sect) {
    return sect.split('\n') // process each section
    .map(function (l) {
      return l.trim();
    }).filter(function (l) {
      return l.length;
    }) // trim and remove empty line     
    .map(function (l) {
      return l.split(':').map(function (w) {
        return w.trim();
      });
    }) // split to word array (kv)     
    .filter(function (arr) {
      return arr.length === 2 && arr[0].length;
    }) // filter out non-kv     
    .reduce(function (obj, arr) {
      return K(obj)(obj[camelCase(arr[0])] = arr[1]);
    }, {});
  });
}; // merge into one object 


var probeProcAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(path, multi) {
    var stdout;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.resolve)(child.execAsync('cat /proc/' + path));

          case 2:
            stdout = _context.sent;
            return _context.abrupt('return', multi ? parseMultiSectionOutput(stdout) : parseSingleSectionOutput(stdout));

          case 4:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function probeProcAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

// return undefined if not barcelona
var probeWS215iAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var arr;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return (0, _bluebird.resolve)(fs.statAsync('/proc/BOARD_io'));

          case 3:
            _context2.next = 5;
            return (0, _bluebird.resolve)((0, _bluebird.all)([child.execAsync('dd if=/dev/mtd0ro bs=1 skip=1697760 count=11'), child.execAsync('dd if=/dev/mtd0ro bs=1 skip=1697664 count=20'), child.execAsync('dd if=/dev/mtd0ro bs=1 skip=1660976 count=6 | xxd -p')]));

          case 5:
            arr = _context2.sent;
            return _context2.abrupt('return', {
              serial: arr[0].toString(),
              p2p: arr[1].toString(),
              mac: arr[2].trim().match(/.{2}/g).join(':')
            });

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);

          case 11:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[0, 9]]);
  }));

  return function probeWS215iAsync() {
    return _ref2.apply(this, arguments);
  };
}();

// callback version is much easier than that of async version with bluebird promise reflection
var dmiDecode = function dmiDecode(cb) {

  var count = dminames.length,
      dmidecode = {};
  var end = function end() {
    return ! --count && cb(null, dmidecode);
  };

  dminames.forEach(function (name) {
    return child.exec('dmidecode -s ' + name, function (err, stdout) {
      return end(!err && stdout.length && (dmidecode[camelCase(name)] = stdout.toString().split('\n')[0].trim()));
    });
  });
};

// return undefined for barcelona
var dmiDecodeAsync = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return (0, _bluebird.resolve)(fs.statAsync('/proc/BOARD_io'));

          case 3:
            return _context3.abrupt('return');

          case 6:
            _context3.prev = 6;
            _context3.t0 = _context3['catch'](0);

          case 8:
            _context3.next = 10;
            return (0, _bluebird.resolve)((0, _bluebird.promisify)(dmiDecode)());

          case 10:
            return _context3.abrupt('return', _context3.sent);

          case 11:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[0, 6]]);
  }));

  return function dmiDecodeAsync() {
    return _ref3.apply(this, arguments);
  };
}();

// return null if not in production deployment
var probeReleaseAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4() {
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(process.cwd() === '/wisnuc/appifi')) {
              _context4.next = 11;
              break;
            }

            _context4.prev = 1;
            _context4.t0 = JSON;
            _context4.next = 5;
            return (0, _bluebird.resolve)(fs.readFileAsync('/wisnuc/appifi/.release.json'));

          case 5:
            _context4.t1 = _context4.sent;
            return _context4.abrupt('return', _context4.t0.parse.call(_context4.t0, _context4.t1));

          case 9:
            _context4.prev = 9;
            _context4.t2 = _context4['catch'](1);

          case 11:
            return _context4.abrupt('return', null);

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[1, 9]]);
  }));

  return function probeReleaseAsync() {
    return _ref4.apply(this, arguments);
  };
}();

// return null if not in production deployment
var probeRevisionAsync = function () {
  var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5() {
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(process.cwd() === '/wisnuc/appifi')) {
              _context5.next = 9;
              break;
            }

            _context5.prev = 1;
            _context5.next = 4;
            return (0, _bluebird.resolve)(fs.readFileAsync('/wisnuc/appifi/.revision'));

          case 4:
            return _context5.abrupt('return', _context5.sent.toString().trim());

          case 7:
            _context5.prev = 7;
            _context5.t0 = _context5['catch'](1);

          case 9:
            return _context5.abrupt('return', null);

          case 10:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, undefined, [[1, 7]]);
  }));

  return function probeRevisionAsync() {
    return _ref5.apply(this, arguments);
  };
}();

fs.stat('/proc/BOARD_io', function (err) {
  return err || barcelona.init();
});

module.exports = {

  probeAsync: function () {
    var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6() {
      var arr;
      return _regenerator2.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return (0, _bluebird.resolve)((0, _bluebird.all)([probeProcAsync('cpuinfo', true), probeProcAsync('meminfo', false), probeWS215iAsync(), dmiDecodeAsync(), probeReleaseAsync(), probeRevisionAsync()]));

            case 2:
              arr = _context6.sent;
              return _context6.abrupt('return', this.data = {
                cpuInfo: arr[0],
                memInfo: arr[1],
                ws215i: arr[2],
                dmidecode: arr[3],
                release: arr[4],
                commit: arr[5] // for historical reason, this is named commit
              });

            case 4:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, this);
    }));

    function probeAsync() {
      return _ref6.apply(this, arguments);
    }

    return probeAsync;
  }(),

  get: function get() {
    return this.data;
  },
  isWS215i: function isWS215i() {
    return this.data && this.data.ws215i;
  }
};