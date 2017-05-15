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

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mkdirpAsync = _bluebird2.default.promisify(_mkdirp2.default);
_bluebird2.default.promisifyAll(_fs2.default);

var root = undefined;

var join = function join(name) {
    return _path2.default.join(root, name);
};

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
                        return (0, _bluebird.resolve)(mkdirpAsync(root));

                    case 5:
                        _context.next = 7;
                        return (0, _bluebird.resolve)(_bluebird2.default.all([mkdirpAsync(join('cluster_tmp')), mkdirpAsync(join('cluster_file')), mkdirpAsync(join('filemap'))]));

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

var setRoot = function setRoot(rootpath, callback) {
    return setRootAsync(rootpath).then(function (r) {
        return callback(null, r);
    }).catch(function (e) {
        return callback(e);
    });
};

var getPath = function getPath(name) {
    if (!root) throw new Error('root not set');
    switch (name) {
        case 'cluster_tmp':
        case 'cluster_file':
        case 'filemap':
            return join(name);
        case 'root':
            return root;
        default:
            throw new Error('get undefined path :${name}');
    }
};

exports.default = { setRoot: setRoot, setRootAsync: setRootAsync, get: getPath };