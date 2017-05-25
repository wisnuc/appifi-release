'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

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

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _bluebird = require('bluebird');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _config = require('../cluster/config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isFruitmix = function isFruitmix(type) {
  return type === 'fruitmix';
};

var rootPathAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(type, uuid) {
    var storage, blocks, volumes, fileSystems, target;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(type !== 'fs')) {
              _context.next = 2;
              break;
            }

            throw new Error('type not supported, yet');

          case 2:
            _context.t0 = JSON;
            _context.next = 5;
            return (0, _bluebird.resolve)(_fs2.default.readFileAsync('/run/wisnuc/storage'));

          case 5:
            _context.t1 = _context.sent;
            storage = _context.t0.parse.call(_context.t0, _context.t1);
            blocks = storage.blocks, volumes = storage.volumes;

            if (!(!Array.isArray(blocks) || !Array.isArray(volumes))) {
              _context.next = 10;
              break;
            }

            throw new Error('bad storage format');

          case 10:

            /** TODO this function should be in sync with extractFileSystem in boot.js **/
            fileSystems = [].concat((0, _toConsumableArray3.default)(blocks.filter(function (blk) {
              return blk.isFileSystem && !blk.isVolumeDevice && blk.isMounted;
            })), (0, _toConsumableArray3.default)(volumes.filter(function (vol) {
              return vol.isFileSystem && !vol.isMissing && vol.isMounted;
            })));

            if (uuid) {
              _context.next = 13;
              break;
            }

            return _context.abrupt('return', fileSystems);

          case 13:
            target = fileSystems.find(function (fsys) {
              return fsys.fileSystemUUID === uuid;
            });

            if (target) {
              _context.next = 16;
              break;
            }

            throw new Error('not found');

          case 16:
            return _context.abrupt('return', target.mountpoint);

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function rootPathAsync(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var Worker = function (_EventEmitter) {
  (0, _inherits3.default)(Worker, _EventEmitter);

  function Worker() {
    (0, _classCallCheck3.default)(this, Worker);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Worker.__proto__ || (0, _getPrototypeOf2.default)(Worker)).call(this));

    _this.finished = false;
    _this.state = 'PADDING';
    _this.id = _nodeUuid2.default.v4();
    _this.userUUID = '';
    return _this;
  }

  (0, _createClass3.default)(Worker, [{
    key: 'cleanUp',
    value: function cleanUp() {}
  }, {
    key: 'finalize',
    value: function finalize() {
      this.cleanUp();
      this.finished = true;
    }
  }, {
    key: 'error',
    value: function error(e) {
      console.log('error', e);

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.emit.apply(this, ['error', e].concat(args));
      this.finalize();
    }
  }, {
    key: 'finish',
    value: function finish(data) {
      console.log('finish this task');

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      this.emit.apply(this, ['finish', data].concat(args));
      this.finalize();
    }
  }, {
    key: 'start',
    value: function start() {
      if (this.finished) throw 'worker already finished';
      console.log('start run worker');
      this.run();
    }
  }, {
    key: 'abort',
    value: function abort() {
      console.log('abort');
      if (this.finished) throw 'worker already finished';
      this.emit('error', new _error2.default.EABORT());
      this.finalize();
    }
  }, {
    key: 'isRunning',
    value: function isRunning() {
      return this.state === 'RUNNING';
    }
  }, {
    key: 'isPadding',
    value: function isPadding() {
      return this.state === 'PADDING';
    }
  }]);
  return Worker;
}(_events2.default);

/**
 * state:
 * PADDING
 * RUNNING
 * FINISHED
 * WARNING
 */

/**
 * src / dst:{
 *  type: 'fruitmix' or 'ext'
 *  path:  if type = 'fruitmix', UUID / else relpath
 *  rootPath: if type = 'fruitmix' ,it undefine, else UUID
 * }
 * 
 * 
 */

var Move = function (_Worker) {
  (0, _inherits3.default)(Move, _Worker);

  function Move(src, dst, data, userUUID) {
    (0, _classCallCheck3.default)(this, Move);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (Move.__proto__ || (0, _getPrototypeOf2.default)(Move)).call(this));

    _this2.src = src;
    _this2.dst = dst;
    _this2.data = data;
    _this2.userUUID = userUUID;
    return _this2;
  }

  (0, _createClass3.default)(Move, [{
    key: 'cleanUp',
    value: function cleanUp() {}
  }, {
    key: 'setSrcPath',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
        var srcType, spath;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                srcType = this.src.type === 'fruitmix';

                if (srcType) {
                  _context2.next = 9;
                  break;
                }

                _context2.next = 4;
                return (0, _bluebird.resolve)(rootPathAsync('fs', this.src.rootPath));

              case 4:
                spath = _context2.sent;

                this.srcPath = _path2.default.join(spath, this.src.path);
                return _context2.abrupt('return', this.srcPath);

              case 9:
                this.srcPath = this.data.findNodeByUUID(this.src.path).abspath();
                return _context2.abrupt('return', this.srcPath);

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function setSrcPath() {
        return _ref2.apply(this, arguments);
      }

      return setSrcPath;
    }()
  }, {
    key: 'setDstPath',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
        var dstType, dpath;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                dstType = this.dst.type === 'fruitmix';

                if (dstType) {
                  _context3.next = 9;
                  break;
                }

                _context3.next = 4;
                return (0, _bluebird.resolve)(rootPathAsync('fs', this.dst.rootPath));

              case 4:
                dpath = _context3.sent;

                this.dstPath = _path2.default.join(dpath, this.dst.path);
                return _context3.abrupt('return', this.dstPath);

              case 9:
                this.dstPath = this.data.findNodeByUUID(this.dst.path).abspath();
                return _context3.abrupt('return', this.dstPath);

              case 11:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function setDstPath() {
        return _ref3.apply(this, arguments);
      }

      return setDstPath;
    }()
  }, {
    key: 'setPath',
    value: function setPath(callback) {
      var _this3 = this;

      this.setSrcPath().asCallback(function (e) {
        if (e) return callback(e);
        _this3.setDstPath().asCallback(function (e) {
          if (e) return callback(e);
          return callback();
        });
      });
    }
  }, {
    key: 'run',
    value: function run() {
      var _this4 = this;

      if (this.state !== 'PADDING') return;
      this.state = 'RUNNING';
      var srcType = this.src.type === 'fruitmix';
      var dstType = this.dst.type === 'fruitmix';
      var modeType = srcType && dstType ? 'FF' : srcType && !dstType ? 'FE' : !srcType && dstType ? 'EF' : 'EE';

      this.setPath(function (e) {
        if (e) return _this4.error(e);
        if (_this4.dstPath.indexOf(_this4.srcPath) !== -1) return _this4.error(new Error('dst could not be child of src'));
        _this4.work(modeType);
      });
    }
  }, {
    key: 'work',
    value: function work(modeType) {
      var _this5 = this;

      console.log('start run new task');
      console.log(this.srcPath, this.dstPath);
      switch (modeType) {
        case 'FF':
        case 'FE':
          this.copy(function (err) {
            if (_this5.finished) return;
            if (err) return _this5.error(err);
            _this5.delete(function (err) {
              if (_this5.finished) return;
              if (err) return _this5.error(err);

              var srcNode = _this5.data.findNodeByUUID(_this5.src.path);
              var dstNode = _this5.data.findNodeByUUID(_this5.dst.path);
              if (srcNode) {
                if (srcNode.parent) _this5.data.requestProbeByUUID(srcNode.parent.uuid);else _this5.data.requestProbeByUUID(srcNode.uuid);
              }

              if (dstNode) _this5.data.requestProbeByUUID(dstNode.uuid);

              return _this5.finish(_this5); //TODO probe
            });
          });
          break;
        case 'EF':
          this.cleanXattr(function (err) {
            if (_this5.finished) return;
            if (err) return _this5.error(err);
            _this5.move(function (err) {
              if (_this5.finished) return;
              if (err) return _this5.error(err);

              var dstNode = _this5.data.findNodeByUUID(_path2.default.basename(_this5.dst.path));
              if (dstNode) _this5.data.requestProbeByUUID(dstNode.uuid);
              return _this5.finish(_this5);
            });
          });
          break;
        case 'EE':
          this.move(function (err) {
            if (_this5.finished) return;
            if (err) return _this5.error(err);
            return _this5.finish(_this5);
          });
      }
    }
  }, {
    key: 'copy',
    value: function copy(callback) {
      // let srcpath = this.src.type === 'fruitmix' ? this.data.findNodeByUUID(path.basename(this.src.path)) : 
      // TODO to join ext path Jack
      _child_process2.default.exec('cp -r --reflink=auto ' + this.srcPath + ' ' + this.dstPath, function (err, stdout, stderr) {
        if (err) return callback(err);
        if (stderr) return callback(stderr);
        return callback(null, stdout);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(callback) {
      // TODO  join Path Jack
      _child_process2.default.exec('rm -rf ' + this.srcPath, function (err, stdout, stderr) {
        if (err) return callback(err);
        if (stderr) return callback(stderr);
        return callback(null, stdout);
      });
    }

    // visitor tree dump xattr

  }, {
    key: 'cleanXattr',
    value: function cleanXattr(callback) {
      var clean = function clean(dir, dirContext, entry, callback) {
        var xattrType = dirContext.type;
        var fpath = _path2.default.join(dir, entry);
        _fsXattr2.default.setSync(fpath, xattrType, (0, _stringify2.default)({}));
        _fs2.default.lstatSync(fpath).isFile() ? callback() : callback(dirContext);
      };
      this.visit(this.srcPath, { type: 'user.fruitmix' }, clean, callback);
    }
  }, {
    key: 'move',
    value: function move(callback) {
      _child_process2.default.exec('mv -f ' + this.srcPath + ' ' + this.dstPath, function (err, stdout, stderr) {
        if (err) return callback(err);
        if (stderr) return callback(stderr);
        return callback(null, stdout);
      });
    }
  }, {
    key: 'visit',
    value: function (_visit) {
      function visit(_x3, _x4, _x5, _x6) {
        return _visit.apply(this, arguments);
      }

      visit.toString = function () {
        return _visit.toString();
      };

      return visit;
    }(function (dir, dirContext, func, done) {
      _fs2.default.readdir(dir, function (err, entries) {
        if (err || entries.length === 0) return done();

        var count = entries.length;
        entries.forEach(function (entry) {

          func(dir, dirContext, entry, function (entryContext) {
            if (entryContext) {
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
    })
  }]);
  return Move;
}(Worker);

var Copy = function (_Worker2) {
  (0, _inherits3.default)(Copy, _Worker2);

  function Copy(src, dst, tmp, data, userUUID) {
    (0, _classCallCheck3.default)(this, Copy);

    var _this6 = (0, _possibleConstructorReturn3.default)(this, (Copy.__proto__ || (0, _getPrototypeOf2.default)(Copy)).call(this));

    _this6.src = src;
    _this6.dst = dst;
    _this6.tmp = tmp;
    _this6.data = data;
    _this6.userUUID = userUUID;
    return _this6;
  }

  (0, _createClass3.default)(Copy, [{
    key: 'cleanUp',
    value: function cleanUp() {}
  }, {
    key: 'run',
    value: function run() {
      var _this7 = this;

      if (this.state !== 'PADDING') return;
      this.state = 'RUNNING';
      var srcType = isFruitmix(this.src.type);
      var dstType = isFruitmix(this.dst.type);

      //check src.type .path

      var modeType = srcType && dstType ? 'FF' : srcType && !dstType ? 'FE' : !srcType && dstType ? 'EF' : 'EE';
      // switch(modeType){
      //   case 'FF':
      //   case 'EF'://probe
      //     break
      //   case 'FE':
      //   case 'EE':
      //     break
      // }
      this.copy(function (err) {
        if (_this7.finished) return;
        if (err) return _this7.error(err);
        _fs2.default.rename(_this7.tmp, _this7.dst, function (err) {
          if (_this7.finished) return;
          if (err) return _this7.error(err);
          if (modeType === 'FF') {
            var srcNode = _this7.data.findNodeByUUID(_path2.default.basename(_this7.src));
            var dstNode = _this7.data.findNodeByUUID(_path2.default.basename(_this7.dst));
            if (srcNode) _this7.data.requestProbeByUUID(srcNode.parent);
            if (dstNode) _this7.data.requestProbeByUUID(dstNode.uuid);
          } //probe src dst
          if (modeType === 'EF') {
            var _dstNode = _this7.data.findNodeByUUID(_path2.default.basename(_this7.dst));
            if (_dstNode) _this7.data.requestProbeByUUID(_dstNode.uuid);
          } //probe dst
          return _this7.finish(_this7);
        });
      });
    }
  }, {
    key: 'copy',
    value: function copy(callback) {
      _child_process2.default.exec('cp -r --reflink=auto ' + this.src + ' ' + this.tmp, function (err, stdout, stderr) {
        if (err) return callback(err);
        if (stderr) return callback(stderr);
        return callback(null, stdout);
      });
    }
  }]);
  return Copy;
}(Worker);

var Transfer = function () {
  function Transfer(data) {
    (0, _classCallCheck3.default)(this, Transfer);

    this.workersQueue = [];
    this.warningQueue = [];
    this.limit = 1;
    this.data = data;
  }

  (0, _createClass3.default)(Transfer, [{
    key: 'schedule',
    value: function schedule() {
      var diff = this.limit - this.workersQueue.filter(function (worker) {
        return worker.isRunning();
      }).length;
      if (diff <= 0) return;

      this.workersQueue.filter(function (worker) {
        return worker.isPadding();
      }).slice(0, diff).forEach(function (worker) {
        return worker.start();
      });
    }
  }, {
    key: 'createMove',
    value: function createMove(_ref4, callback) {
      var _this8 = this;

      var src = _ref4.src,
          dst = _ref4.dst,
          userUUID = _ref4.userUUID;

      createMoveWorker(src, dst, this.data, userUUID, function (err, worker) {
        if (err) return callback(err);
        worker.on('finish', function (worker) {
          worker.state = 'FINISHED';
          _this8.schedule();
        });
        worker.on('error', function (worker) {
          worker.state = 'WARNING';
          _this8.workersQueue.splice(_this8.workersQueue.indexOf(worker), 1);
          _this8.warningQueue.push(worker);
          _this8.schedule();
        });
        _this8.workersQueue.push(worker);
        callback(null, { id: worker.id, state: worker.state });
        _this8.schedule();
      });
    }
  }, {
    key: 'createCopy',
    value: function createCopy(_ref5, callback) {
      var _this9 = this;

      var src = _ref5.src,
          dst = _ref5.dst,
          userUUID = _ref5.userUUID;

      createCopyWorker(src, dst, this.data, userUUID, function (err, worker) {
        if (err) return callback(err);
        worker.on('finish', function (worker) {
          worker.state = 'FINISHED';
          _this9.schedule();
        });
        worker.on('error', function (worker) {
          worker.state = 'WARNING';
          _this9.workersQueue.splice(_this9.workersQueue.indexOf(worker), 1);
          _this9.warningQueue.push(worker);
          _this9.schedule();
        });
        _this9.workersQueue.push(worker);
        _this9.schedule();
        callback(null, worker);
      });
    }
  }, {
    key: 'getWorkers',
    value: function getWorkers(userUUID, callback) {
      var data = this.workersQueue.filter(function (worker) {
        return worker.userUUID === userUUID;
      });
      process.nextTick(function () {
        return callback(null, data);
      });
    }
  }, {
    key: 'abortWorker',
    value: function abortWorker(_ref6, callback) {
      var userUUID = _ref6.userUUID,
          workerId = _ref6.workerId;

      var worker = this.workersQueue.find(function (worker) {
        return worker.id === workerId && worker.userUUID === userUUID;
      });
      if (worker) {
        try {
          worker.abort();
          process.nextTick(function () {
            return callback(null, true);
          });
        } catch (e) {
          process.nextTick(function () {
            return callback(e);
          });
        }
      } else {
        process.nextTick(function () {
          return callback(new _error2.default.EABORT());
        });
      }
    }
  }, {
    key: 'register',
    value: function register(ipc) {
      ipc.register('createMove', this.createMove.bind(this));
      ipc.register('createCopy', this.createCopy.bind(this));
      ipc.register('getWorkers', this.getWorkers.bind(this));
      ipc.register('abortWorker', this.abortWorker.bind(this));
    }
  }]);
  return Transfer;
}();

var createMoveWorker = function createMoveWorker(src, dst, data, userUUID, callback) {
  // if(fs.existsSync(src) && fs.existsSync(dst)) {
  var worker = new Move(src, dst, data);
  return callback(null, worker);
  // }
  // return callback(new Error('path not exists'))
};

var createCopyWorker = function createCopyWorker(src, dst, data, userUUID, callback) {
  var tmp = _path2.default.join(_config2.default.path, 'tmp'); //TODO Get tmp folder Jack
  // if(fs.existsSync(src) && fs.existsSync(dst)) {
  var worker = new Copy(src, dst, tmp, data);
  return callback(null, worker);
  // }
  // return callback(new Error('path not exists'))
};

exports.default = Transfer;