'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.requestTokenAsync = exports.fakeRepoSilenced = exports.fakePathModel = undefined;

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _async = require('./async');

var _supertest = require('supertest');

var _supertest2 = _interopRequireDefault(_supertest);

var _paths = require('../lib/paths');

var _paths2 = _interopRequireDefault(_paths);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _userModel = require('src/fruitmix/models/userModel');

var _driveModel = require('src/fruitmix/models/driveModel');

var _repo = require('src/fruitmix/lib/repo');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fakePathModel = exports.fakePathModel = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(fakeroot, users, drives) {
    var dir, tmpdir, umod, dmod;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            dir = void 0, tmpdir = void 0;
            _context.next = 3;
            return (0, _bluebird.resolve)((0, _async.rimrafAsync)(fakeroot));

          case 3:
            _context.next = 5;
            return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(fakeroot));

          case 5:
            _context.next = 7;
            return (0, _bluebird.resolve)(_paths2.default.setRootAsync(fakeroot));

          case 7:

            // fake drive dir
            dir = _paths2.default.get('drives');

            if (!drives.length) {
              _context.next = 11;
              break;
            }

            _context.next = 11;
            return (0, _bluebird.resolve)((0, _bluebird.all)(drives.map(function (drv) {
              return (0, _async.mkdirpAsync)(_path2.default.join(dir, drv.uuid));
            })));

          case 11:

            // write model files
            dir = _paths2.default.get('models');
            tmpdir = _paths2.default.get('tmp');

            if (!users.length) {
              _context.next = 16;
              break;
            }

            _context.next = 16;
            return (0, _bluebird.resolve)(_async.fs.writeFileAsync(_path2.default.join(dir, 'users.json'), (0, _stringify2.default)(users, null, '  ')));

          case 16:
            if (!drives.length) {
              _context.next = 19;
              break;
            }

            _context.next = 19;
            return (0, _bluebird.resolve)(_async.fs.writeFileAsync(_path2.default.join(dir, 'drives.json'), (0, _stringify2.default)(drives, null, '  ')));

          case 19:
            _context.next = 21;
            return (0, _bluebird.resolve)((0, _userModel.createUserModelAsync)(_path2.default.join(dir, 'users.json'), tmpdir));

          case 21:
            umod = _context.sent;
            _context.next = 24;
            return (0, _bluebird.resolve)((0, _driveModel.createDriveModelAsync)(_path2.default.join(dir, 'drives.json'), tmpdir));

          case 24:
            dmod = _context.sent;


            // set models
            _models2.default.setModel('user', umod);
            _models2.default.setModel('drive', dmod);

          case 27:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function fakePathModel(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var createRepoSilenced = function createRepoSilenced(model, callback) {

  // kidding
  var K = function K(x) {
    return function (y) {
      return x;
    };
  };

  var finished = false;

  var probeStarted = false;
  var probeStopped = false;
  var hashMagicStarted = false;
  var hashMagicStopped = false;
  var metaStarted = false;
  var metaStopped = false;

  var print = function print() {
    return console.log(probeStarted + ' ' + probeStopped + ', ' + hashMagicStarted + ' ' + hashMagicStopped + ', ' + metaStarted + ', ' + metaStopped);
  };

  var allDone = function allDone() {
    return probeStarted === probeStopped && hashMagicStarted === hashMagicStopped && metaStarted === metaStopped;
  };

  var repo = (0, _repo.createRepo)(model);

  // if no err, return repo after driveCached
  repo.filer.on('probeStarted', function () {
    probeStarted = true;
  });

  repo.filer.on('probeStopped', function () {
    probeStopped = true;

    if (finished) return;
    if (allDone()) return callback(null, repo);
  });

  repo.hashMagicBuilder.on('hashMagicBuilderStarted', function () {
    hashMagicStarted = true;
  });

  repo.hashMagicBuilder.on('hashMagicBuilderStopped', function () {
    hashMagicStopped = true;
    if (finished) return;
    if (allDone()) return callback(null, repo);
  });

  repo.metaBuilder.on('metaBuilderStarted', function () {
    metaStarted = true;
  });

  repo.metaBuilder.on('metaBuilderStopped', function () {
    metaStopped = true;
    if (finished) return;
    if (allDone()) return callback(null, repo);
  });

  // init & if err return err
  repo.init(function (err) {

    if (err) {
      finished = true;
      return callback(err);
    }

    if (repo.filer.roots.length === 0) {
      callback(null, repo);
    }
  });
};

var createRepoSilencedAsync = (0, _bluebird.promisify)(createRepoSilenced);

var fakeRepoSilenced = exports.fakeRepoSilenced = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var dmod, repo;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            dmod = _models2.default.getModel('drive');

            // create repo and wait until drives cached

            _context2.next = 3;
            return (0, _bluebird.resolve)(createRepoSilencedAsync(dmod));

          case 3:
            repo = _context2.sent;

            _models2.default.setModel('filer', repo.filer);
            _models2.default.setModel('repo', repo);
            return _context2.abrupt('return', repo);

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function fakeRepoSilenced() {
    return _ref2.apply(this, arguments);
  };
}();

var requestToken = function requestToken(app, userUUID, passwd, callback) {

  (0, _supertest2.default)(app).get('/token').auth(userUUID, passwd).set('Accept', 'application/json').end(function (err, res) {
    if (err) return callback(err);
    callback(null, res.body.token);
  });
};

var requestTokenAsync = exports.requestTokenAsync = (0, _bluebird.promisify)(requestToken);