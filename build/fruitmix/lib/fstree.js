'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.list = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_fs2.default);

var listAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(target) {
    var level = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    var stat;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _fs2.default.lstatAsync(target);

          case 2:
            stat = _context.sent;

            if (!(stat.isDirectory() || stat.isFile())) {
              _context.next = 15;
              break;
            }

            _context.t0 = {
              path: target,
              type: stat.isDirectory() ? 'folder' : 'file',
              mtime: stat.mtime.getTime(),
              size: stat.size
            };

            if (!(level === 0 || !stat.isDirectory())) {
              _context.next = 9;
              break;
            }

            _context.t1 = {};
            _context.next = 13;
            break;

          case 9:
            _context.next = 11;
            return _fs2.default.readdirAsync(target).map(function (entry) {
              return listAsync(_path2.default.join(target, entry), level - 1);
            }).filter(function (item) {
              return !!item;
            });

          case 11:
            _context.t2 = _context.sent;
            _context.t1 = {
              children: _context.t2
            };

          case 13:
            _context.t3 = _context.t1;
            return _context.abrupt('return', (0, _assign2.default)(_context.t0, _context.t3));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function listAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
export default (target, level, callback) => 
  listAsync(target, level).asCallbacek(callback) 
**/

var list = function list(target, level, callback) {

  _fs2.default.lstat(target, function (err, stat) {

    if (err) return callback(err);
    if (!stat.isDirectory() && !stat.isFile()) return callback();

    var node = {
      path: target,
      type: stat.isDirectory() ? 'folder' : 'file',
      name: _path2.default.basename(target)
    };

    if (stat.isFile()) {
      node.mtime = stat.mtime.getTime(), node.size = stat.size;
    }

    if (level === 0 || !stat.isDirectory()) return callback(null, node);

    _fs2.default.readdir(target, function (err, entries) {

      if (err || entries.length === 0) return callback(null, node);

      var count = entries.length;
      entries.forEach(function (entry) {

        list(_path2.default.join(target, entry), level - 1, function (err, child) {

          if (err) {
            if (! --count) return callback(null, node);
          } else {
            if (child) {
              if (node.children) {
                node.children.push(child);
              } else {
                node.children = [child];
              }
            }
            if (! --count) return callback(null, node);
          }
        });
      });
    });
  });
};

/**
listAsync('tmptest', 1).asCallback((err, node) => console.log(err || JSON.stringify(node, null, '  ')))
**/

/**
list('node_modules', 10, (err, node) => {
  console.log(err || JSON.stringify(node, null, '  '))
})
**/

exports.list = list;