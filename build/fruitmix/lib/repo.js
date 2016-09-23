'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testing = exports.createRepo = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _async = require('../util/async');

var _xstat = require('./xstat');

var _drive = require('./drive');

var _hashMagic = require('./hashMagic');

var _hashMagic2 = _interopRequireDefault(_hashMagic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// repo is responsible for managing all drives

var Repo = function (_EventEmitter) {
  (0, _inherits3.default)(Repo, _EventEmitter);


  // repo constructor

  function Repo(paths, driveModel, forest) {
    (0, _classCallCheck3.default)(this, Repo);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Repo).call(this));

    _this.paths = paths;
    _this.driveModel = driveModel;
    _this.forest = forest;

    _this.forest.on('driveCached', function () {
      return console.log('driveCached: ' + drive.uuid);
    });
    _this.forest.on('hashlessAdded', function (node) {
      console.log('hashlessAdded drive: uuid:' + node.uuid + ' path:' + node.namepath());
      _this.hashMagicWorker.start(node.namepath(), node.uuid);
    });

    _this.state = 'IDLE'; // 'INITIALIZING', 'INITIALIZED', 'DEINITIALIZING',

    _this.scanners = [];

    _this.hashMagicWorker = (0, _hashMagic2.default)();
    _this.hashMagicWorker.on('end', function (ret) {

      if (_this.state === 'IDLE') return;

      // find drive containing this uuid
      _this.forest.updateHashMagic(ret.target, ret.uuid, ret.hash, ret.magic, ret.timestamp, function (err) {

        if (_this.forest.hashless.size === 0) {
          console.log('hashMagicWorkerStopped');
          return _this.emit('hashMagicWorkerStopped');
        }

        var node = _this.forest.hashless.values().next().value;
        _this.hashMagicWorker.start(node.namepath(), node.uuid);
      });
    });

    return _this;
  }

  (0, _createClass3.default)(Repo, [{
    key: 'initAsync',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
        var _this2 = this;

        var dir, list, props, i, conf, stat, roots, promises;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this.state !== 'IDLE')) {
                  _context.next = 2;
                  break;
                }

                throw new Error('invalid state');

              case 2:

                this.state = 'INITIALIZING';

                dir = this.paths.get('drives');
                list = this.driveModel.collection.list;
                props = [];

                // TODO this is the easy version

                i = 0;

              case 7:
                if (!(i < list.length)) {
                  _context.next = 24;
                  break;
                }

                conf = list[i];

                if (!(conf.URI !== 'fruitmix')) {
                  _context.next = 11;
                  break;
                }

                return _context.abrupt('continue', 21);

              case 11:
                _context.prev = 11;
                _context.next = 14;
                return _async.fs.statAsync(_path2.default.join(dir, conf.uuid));

              case 14:
                stat = _context.sent;

                if (stat.isDirectory()) {
                  props.push({
                    uuid: conf.uuid,
                    type: 'folder',
                    owner: conf.owner,
                    writelist: conf.writelist,
                    readlist: conf.readlist,
                    name: _path2.default.join(dir, conf.uuid)
                  });
                }
                _context.next = 21;
                break;

              case 18:
                _context.prev = 18;
                _context.t0 = _context['catch'](11);
                return _context.abrupt('continue', 21);

              case 21:
                i++;
                _context.next = 7;
                break;

              case 24:
                // loop end

                roots = props.map(function (prop) {
                  return _this2.forest.createNode(null, prop);
                });
                promises = roots.map(function (root) {
                  return new _bluebird2.default(function (resolve) {
                    return _this2.forest.scan(root, function () {
                      console.log('[repo] init: scan root finished: ' + root.uuid);
                      resolve();
                    });
                  });
                });


                _bluebird2.default.all(promises).then(function () {
                  console.log('[repo] init: ' + roots.length + ' drives cached');
                  _this2.emit('driveCached');
                }).catch(function (e) {});

                this.state = 'INITIALIZED';
                console.log('[repo] init: initialized');

              case 29:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[11, 18]]);
      }));

      function initAsync() {
        return _ref.apply(this, arguments);
      }

      return initAsync;
    }()

    // TODO there may be a small risk that a user is deleted but drive not

  }, {
    key: 'init',
    value: function init(callback) {
      this.initAsync().then(function () {
        return callback();
      }).catch(function (e) {
        return callback(e);
      });
    }

    // TODO

  }, {
    key: 'deinit',
    value: function deinit() {
      this.hashMagicWorker.abort();
      this.state = 'IDLE';
    }

    // FIXME real implementation should maintain a table

  }, {
    key: 'getTmpDirForDrive',
    value: function getTmpDirForDrive(drive) {
      return this.paths.get('tmp');
    }
  }, {
    key: 'getTmpFolderForNode',
    value: function getTmpFolderForNode(node) {
      return this.paths.get('tmp');
    }
  }, {
    key: 'getDrives',
    value: function getDrives(userUUID) {
      return this.driveModel.collection.list;
    }

    //  label
    //  fixedOwner: true
    //  URI: fruitmix
    //  uuid
    //  owner
    //  writelist
    //  readlist
    //  cache

  }, {
    key: 'createFruitmixDrive',
    value: function createFruitmixDrive(conf, callback) {
      var _this3 = this;

      var dir = this.paths.get('drives');
      var dpath = _path2.default.join(dir, conf.uuid);

      (0, _mkdirp2.default)(dpath, function (err) {
        if (err) return callback(err);
        _this3.driveModel.createDrive(conf, function (err) {
          if (err) return callback(err);

          var root = _this3.forest.createNode(null, {
            uuid: conf.uuid,
            type: 'folder',
            owner: conf.owner,
            writelist: conf.writelist,
            readlist: conf.readlist,
            name: dpath
          });

          _this3.forest.scan(root, function () {
            return console.log('[repo] createFruitmidxDrive: scan (newly created) root finished: ' + root.uuid);
          });

          callback(null, conf);
        });
      });
    }
  }, {
    key: 'createUserDrives',
    value: function createUserDrives(user, callback) {
      var _this4 = this;

      var home = {
        label: 'home',
        fixedOwner: true,
        URI: 'fruitmix',
        uuid: user.home,
        owner: [user.uuid],
        writelist: [],
        readlist: [],
        cache: true
      };

      var lib = {
        label: 'library',
        fixedOwner: 'true',
        URI: 'fruitmix',
        uuid: user.library,
        owner: [user.uuid],
        writelist: [],
        readlist: [],
        cache: true
      };

      // these cannot be done concurrently , RACE !!!
      this.createFruitmixDrive(home, function (err) {
        if (err) return callback(err);
        _this4.createFruitmixDrive(lib, function (err) {
          if (err) return callback(err);
          callback();
        });
      });
    }

    ////////////////////////////////////////////////////////////////////////////////

  }]);
  return Repo;
}(_events2.default);

var createRepo = function createRepo(paths, driveModel, forest) {
  return new Repo(paths, driveModel, forest);
};

var testing = {};

exports.createRepo = createRepo;
exports.testing = testing;