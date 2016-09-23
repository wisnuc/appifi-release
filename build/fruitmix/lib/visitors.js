'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.visitAsync = exports.visit = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var visitAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(dir, dirContext, funcAsync) {
    var wrapper = function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(dir, dirContext, entry, funcAsync) {
        var entryContext;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return funcAsync(dir, dirContext, entry);

              case 2:
                entryContext = _context.sent;

                if (!entryContext) {
                  _context.next = 6;
                  break;
                }

                _context.next = 6;
                return visitAsync(_path2.default.join(dir, entry), entryContext, funcAsync);

              case 6:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function wrapper(_x4, _x5, _x6, _x7) {
        return _ref2.apply(this, arguments);
      };
    }();

    var entries;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _fs2.default.readdirAsync(dir);

          case 2:
            entries = _context2.sent;

            if (!(entries instanceof Error)) {
              _context2.next = 5;
              break;
            }

            return _context2.abrupt('return');

          case 5:
            if (!(entries.length === 0)) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt('return');

          case 7:
            _context2.next = 9;
            return _bluebird2.default.all(entries.map(function (entry) {
              return wrapper(dir, dirContext, entry, funcAsync);
            }));

          case 9:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function visitAsync(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

/*
async function abcAsync(dir, dirContext, entry) {

  console.log('======')
  console.log(dir)
  console.log(dirContext)
  console.log(entry)

  let stats = await fs.statAsync(path.join(dir, entry))
  if (stats instanceof Error) return
  if (stats.isDirectory()) return `context for ${path.join(dir, entry)}`
}

visitAsync('/data', 'Top Context', abcAsync)
  .then(r => console.log('finished'))
  .catch(e => console.log(e)) 
*/

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_fs2.default);

var visit = function visit(dir, dirContext, func, done) {
  _fs2.default.readdir(dir, function (err, entries) {
    if (err || entries.length === 0) return done();

    var count = entries.length;
    entries.forEach(function (entry) {

      func(dir, dirContext, entry, function (entryContext) {
        if (entryContext) {
          // console.log('entering entering')
          visit(_path2.default.join(dir, entry), entryContext, func, function () {
            count--;
            if (count === 0) done();
          });
        } else {
          count--;
          if (count === 0) done();
        }
      });
    });
  });
};

exports.visit = visit;
exports.visitAsync = visitAsync;

/** example 

function xyz(dir, dirContext, entry, callback) {

  console.log(entry)
  fs.stat(path.join(dir, entry), (err, stat) => {

    if (err) {
      callback()
    }
    else if (stat.isDirectory()) {
      callback(`${dir}`)
    }
    else {
      callback()
    }
  })
}

visit('/data', xyz, null, () => {

  console.log('finished')
})

**/