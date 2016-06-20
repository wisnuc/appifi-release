'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var udevInfo = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(sysfspath) {
    var result, output;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            // The P, S, E, N prefix is `query type`, see manpage
            result = { path: null, symlinks: [], name: null, props: {} };
            _context.next = 3;
            return new _promise2.default(function (resolve, reject) {
              return child.exec('udevadm info ' + sysfspath, function (err, stdout, stderr) {
                return err ? reject({ err: err, stdout: stdout, stderr: stderr }) : resolve(stdout);
              });
            });

          case 3:
            output = _context.sent;


            output.toString().split(/\n/).filter(function (l) {
              return l.length;
            }).forEach(function (line) {
              var prefix = line.slice(0, 1);
              var content = line.slice(3);
              var tmp = void 0;
              switch (prefix) {
                case 'P':
                  result.path = content;
                  break;
                case 'S':
                  result.symlinks.push(content);
                  break;
                case 'E':
                  tmp = content.split('=');
                  result.props[tmp[0].toLowerCase()] = tmp[1];
                  break;
                case 'N':
                  result.name = content;
                  break;

                default:
                  break;
              }
            });

            return _context.abrupt('return', result);

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function udevInfo(_x) {
    return ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var child = require('child_process');

var udevInfoAttr = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(sysfspath) {
    var props, p, output;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            props = [], p = null;
            _context2.next = 3;
            return new _promise2.default(function (resolve, reject) {
              return child.exec('udevadm info -a ' + sysfspath, function (err, stdout, stderr) {
                return err ? reject({ err: err, stdout: stdout, stderr: stderr }) : resolve(stdout);
              });
            });

          case 3:
            output = _context2.sent;


            output.toString().split(/\n/).filter(function (l) {
              return l.length;
            }).filter(function (l) {
              return l.startsWith(' ');
            }).map(function (l) {
              return l.trim();
            }).forEach(function (l) {

              if (l.startsWith('looking')) {
                if (p) props.push(p);
                p = {
                  path: l.split('\'')[1],
                  attrs: {}
                };
              } else if (l.startsWith('ATTRS')) {
                // some are in form of ATTRS{...}
                p.attrs[l.slice(6).split('}')[0].toLowerCase()] = l.split('==')[1].slice(1, -1);
              } else if (l.startsWith('ATTR')) {
                // some are in form of ATTR{...}
                p.attrs[l.slice(5).split('}')[0].toLowerCase()] = l.split('==')[1].slice(1, -1);
              } else {
                p[l.split('==')[0].toLowerCase()] = l.split('==')[1].slice(1, -1);
              }
            });

            if (p) props.push(p); // the last one
            return _context2.abrupt('return', props);

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));
  return function udevInfoAttr(_x2) {
    return ref.apply(this, arguments);
  };
}();

var udevInfoBoth = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(sysfspath) {
    var info, attr;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return udevInfo(sysfspath);

          case 2:
            info = _context3.sent;
            _context3.next = 5;
            return udevInfoAttr(sysfspath);

          case 5:
            attr = _context3.sent;
            return _context3.abrupt('return', (0, _assign2.default)({}, info, { sysfsProps: attr }));

          case 7:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));
  return function udevInfoBoth(_x3) {
    return ref.apply(this, arguments);
  };
}();

var udevInfoBatch = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(paths) {
    var e;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            e = new Error('paths must be non-empty string array');

            e.code = 'EINVAL';

            if (Array.isArray(paths)) {
              _context4.next = 4;
              break;
            }

            throw e;

          case 4:
            if (paths.length) {
              _context4.next = 6;
              break;
            }

            throw e;

          case 6:
            if (paths.every(function (path) {
              return typeof path === 'string' || path instanceof String;
            })) {
              _context4.next = 8;
              break;
            }

            throw e;

          case 8:
            return _context4.abrupt('return', _promise2.default.all(paths.map(function (path) {
              return udevInfoBoth(path);
            })));

          case 9:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));
  return function udevInfoBatch(_x4) {
    return ref.apply(this, arguments);
  };
}();

module.exports = udevInfoBatch;