'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var os = require('os');

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var classNetPath = '/sys/class/net';

var mapAsyncMapFilter = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(arr, asyncMapper, mapper, options) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return Promise.map(arr, function (item) {
              return asyncMapper(item).reflect();
            }, options);

          case 2:
            _context.t0 = function (x, index) {
              return x.isFulfilled() ? mapper(arr[index], x.value()) : null;
            };

            _context.t1 = function (x) {
              return !!x;
            };

            return _context.abrupt('return', _context.sent.map(_context.t0).filter(_context.t1));

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function mapAsyncMapFilter(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}();

var enumerateNetworkInterfaceNamesAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(dirpath) {
    var entries, interfaces;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return fs.readdirAsync(dirpath);

          case 2:
            entries = _context2.sent;
            _context2.next = 5;
            return mapAsyncMapFilter(entries, // entries
            function (entry) {
              return fs.lstatAsync(path.join(dirpath, entry));
            }, // imapper, map entry to stat, async
            function (entry, stat) {
              return stat.isSymbolicLink() ? entry : null;
            });

          case 5:
            interfaces = _context2.sent;
            _context2.next = 8;
            return mapAsyncMapFilter(interfaces, function (itfc) {
              return fs.readlinkAsync(path.join(dirpath, itfc));
            }, function (itfc, link) {
              return !link.startsWith('../../devices/virtual/') ? itfc : null;
            });

          case 8:
            return _context2.abrupt('return', _context2.sent);

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function enumerateNetworkInterfaceNamesAsync(_x5) {
    return _ref2.apply(this, arguments);
  };
}();

var autoInt = function autoInt(string) {
  return parseInt(string).toString() === string ? parseInt(string) : string;
};

var formatFileValue = function formatFileValue(value) {

  var arr = value.toString().trim().split('\n');

  // if all have key=value format, return an object
  if (arr.every(function (item) {
    return (item.match(/=/g) || []).length === 1;
  })) {
    var _ret = function () {
      var object = {};
      arr.forEach(function (item) {
        return object[item.split('=')[0]] = autoInt(item.split('=')[1]);
      });
      return {
        v: object
      };
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
  }

  arr = arr.map(function (item) {
    return autoInt(item);
  });

  // otherwise return single string or string array
  return arr.length === 1 ? arr[0] : arr;
};

var genKeyValuePair = function genKeyValuePair(stat, value) {
  if (stat.isFile()) return { key: stat.entry, value: formatFileValue(value) };else if (stat.isSymbolicLink()) return { key: stat.entry, value: value.toString() };else if (stat.isDirectory()) return { key: stat.entry, value: value };else return null;
};

var objectifyAsync = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(dirpath) {
    var object, entries, stats, pairs;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            object = {};
            _context3.next = 3;
            return fs.readdirAsync(dirpath);

          case 3:
            entries = _context3.sent;
            _context3.next = 6;
            return mapAsyncMapFilter(entries, function (entry) {
              return fs.lstatAsync(path.join(dirpath, entry));
            }, function (entry, stat) {
              return (0, _assign2.default)(stat, { entry: entry });
            });

          case 6:
            stats = _context3.sent;
            _context3.next = 9;
            return mapAsyncMapFilter(stats, function (stat) {
              var entryPath = path.join(dirpath, stat.entry);
              if (stat.isFile()) return fs.readFileAsync(entryPath);else if (stat.isSymbolicLink()) return fs.readlinkAsync(entryPath);else if (stat.isDirectory()) return Promise.resolve(objectifyAsync(entryPath));else return null;
            }, function (stat, value) {
              return genKeyValuePair(stat, value);
            });

          case 9:
            pairs = _context3.sent;


            pairs.forEach(function (pair) {
              return object[pair.key] = pair.value;
            });
            return _context3.abrupt('return', object);

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function objectifyAsync(_x6) {
    return _ref3.apply(this, arguments);
  };
}();

var enumerateNetworkInterfacesAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4() {
    var names;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return enumerateNetworkInterfaceNamesAsync(classNetPath);

          case 2:
            names = _context4.sent;
            _context4.next = 5;
            return mapAsyncMapFilter(names, function (name) {
              return Promise.resolve(objectifyAsync(path.join(classNetPath, name)));
            }, function (name, obj) {
              return (0, _assign2.default)(obj, { name: name });
            });

          case 5:
            return _context4.abrupt('return', _context4.sent);

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function enumerateNetworkInterfacesAsync() {
    return _ref4.apply(this, arguments);
  };
}();

//// temporary test code
// enumerateNetworkInterfacesAsync()
//   .then(r => console.log(JSON.stringify(r, null, '  ')))
//   .catch(e => console.log(e))

exports.default = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5() {
  return _regenerator2.default.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.t0 = os.networkInterfaces();
          _context5.next = 3;
          return enumerateNetworkInterfacesAsync();

        case 3:
          _context5.t1 = _context5.sent;
          return _context5.abrupt('return', {
            os: _context5.t0,
            sysfs: _context5.t1
          });

        case 5:
        case 'end':
          return _context5.stop();
      }
    }
  }, _callee5, undefined);
}));