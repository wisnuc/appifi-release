'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _async = require('../util/async');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// holds fruitmix root path, something like /run/wisnuc/[UUID]/wisnuc/fruitmix
// either absolute path or undefined
var root = undefined;

// util functoin
var join = function join(name) {
  return _path2.default.join(root, name);
};

// set fruitmix root, mkdirp all internal folders
var setRootAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(rootpath) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (_path2.default.isAbsolute(rootpath)) {
              _context.next = 2;
              break;
            }

            throw new Error('rootpath must be absolute path');

          case 2:

            root = rootpath;
            _context.next = 5;
            return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(root));

          case 5:
            _context.next = 7;
            return (0, _bluebird.resolve)(_bluebird2.default.all([(0, _async.mkdirpAsync)(join('models')), (0, _async.mkdirpAsync)(join('drives')), (0, _async.mkdirpAsync)(join('documents')), (0, _async.mkdirpAsync)(join('mediashare')), (0, _async.mkdirpAsync)(join('mediashareArchive')), (0, _async.mkdirpAsync)(join('mediatalk')), (0, _async.mkdirpAsync)(join('mediatallArchive')), (0, _async.mkdirpAsync)(join('thumbnail')), (0, _async.mkdirpAsync)(join('log')), (0, _async.mkdirpAsync)(join('etc')), (0, _async.mkdirpAsync)(join('smb')), (0, _async.mkdirpAsync)(join('tmp'))]));

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function setRootAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

// callback version of setRoot
var setRoot = function setRoot(rootpath, callback) {
  return setSysRootAsync(rootpath).then(function (r) {
    return callback(null, r);
  }).catch(function (e) {
    return callback(e);
  });
};

// discard root
var unsetRoot = function unsetRoot() {
  return root = undefined;
};

// get path by name, throw if root unset or name unknown
var getPath = function getPath(name) {

  if (!root) throw new Error('fruitmix root not set');

  switch (name) {
    case 'models':
    case 'drives':
    case 'documents':
    case 'mediashare':
    case 'mediashareArchive':
    case 'mediatalk':
    case 'mediatalkArchive':
    case 'thumbnail':
    case 'log':
    case 'etc':
    case 'smb':
    case 'tmp':
      return join(name);
    case 'root':
      return root;
    default:
      console.log('ERROR: unknown fruitmix path name: ' + name);
      throw new Error('unknown fruitmix path name: ' + name);
  }
};

exports.default = {
  setRoot: setRoot,
  setRootAsync: setRootAsync,
  unsetRoot: unsetRoot,
  get: getPath
};