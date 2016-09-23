'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var test = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var drive, before, after;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            console.log('removing ' + TMPDIR);
            _context.next = 3;
            return rimrafAsync(TMPDIR);

          case 3:

            console.log('mkdir ' + TMPDIR);
            _context.next = 6;
            return (0, _mkdirp2.default)(TMPDIR);

          case 6:

            console.log('set xattr');
            _context.next = 9;
            return _fsXattr2.default.setAsync(TMPDIR, FRUITMIX, preset);

          case 9:

            console.log('untar');
            _context.next = 12;
            return _bluebird2.default.promisify(_child_process2.default.exec)('tar xf ' + KERNEL_TARBALL + ' -C ' + TMPDIR + ' --strip-components=1');

          case 12:

            console.log('create drive');
            _context.next = 15;
            return createDriveAsync(TMPDIR);

          case 15:
            drive = _context.sent;
            before = process.memoryUsage();


            console.log('starting scan');
            _context.next = 20;
            return new _bluebird2.default(function (resolve, reject) {
              return drive.scan(function (err) {
                return err ? reject(err) : resolve(null);
              });
            });

          case 20:
            after = process.memoryUsage();


            console.log('delta rss: ' + pretty(after.rss - before.rss));
            console.log('delta heapTotal: ' + pretty(after.heapTotal - before.heapTotal));
            console.log('delta heapUsed: ' + pretty(after.heapUsed - before.heapUsed));

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function test() {
    return _ref.apply(this, arguments);
  };
}();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _drive = require('../lib/drive');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rimrafAsync = _bluebird2.default.promisify(_rimraf2.default);
var mkdirpAsync = _bluebird2.default.promisify(_mkdirp2.default);
var createDriveAsync = _bluebird2.default.promisify(_drive.createDrive);

_bluebird2.default.promisifyAll(_fs2.default);
_bluebird2.default.promisifyAll(_fsXattr2.default);

var FRUITMIX = 'user.fruitmix';
var cwd = process.cwd();
var TMPDIR = _path2.default.join(cwd, 'tmptest');
var KERNEL_TARBALL = _path2.default.join(cwd, 'testdata/linux-4.7.tar.xz');

var preset = (0, _stringify2.default)({
  uuid: _nodeUuid2.default.v4(),
  owner: [_nodeUuid2.default.v4()],
  writelist: [],
  readlist: []
});

var pretty = function pretty(num) {
  return num / 1024 / 1024;
};

test().then(function () {
  console.log('end');
}).catch(function (e) {
  return console.log(e);
});