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

var isFruitmix = function isFruitmix(uuid) {};

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
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.emit.apply(this, ['error', e].concat(args));
      this.finalize();
    }
  }, {
    key: 'finish',
    value: function finish(data) {
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
      this.run();
    }
  }, {
    key: 'abort',
    value: function abort() {
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
    key: 'run',
    value: function run() {
      var _this3 = this;

      if (this.state !== 'PADDING') return;
      this.state = 'RUNNING';
      var srcType = src.type === 'fruitmix';
      var dstType = dst.type === 'fruitmix';
      var modeType = srcType && dstType ? 'FF' : srcType && !dstType ? 'FE' : !srcType && dstType ? 'EF' : 'EE';
      switch (modeType) {
        case 'FF':
        case 'FE':
          this.copy(function (err) {
            if (_this3.finished) return;
            if (err) return _this3.error(err);
            _this3.delete(function (err) {
              if (_this3.finished) return;
              if (err) return _this3.error(err);

              var srcNode = _this3.data.findNodeByUUID(_path2.default.basename(_this3.src));
              var dstNode = _this3.data.findNodeByUUID(_path2.default.basename(_this3.dst));
              if (srcNode) _this3.data.requestProbeByUUID(srcNode.parent);
              if (dstNode) _this3.data.requestProbeByUUID(dstNode.uuid);

              return _this3.finish(_this3); //TODO probe
            });
          });
          break;
        case 'EF':
          this.cleanXattr(function (err) {
            if (_this3.finished) return;
            if (err) return _this3.error(err);
            _this3.move(function (err) {
              if (_this3.finished) return;
              if (err) return _this3.error(err);

              var dstNode = _this3.data.findNodeByUUID(_path2.default.basename(_this3.dst.path));
              if (dstNode) _this3.data.requestProbeByUUID(dstNode.uuid);
              return _this3.finish(_this3);
            });
          });
          break;
        case 'EE':
          this.move(function (err) {
            if (_this3.finished) return;
            if (err) return _this3.error(err);
            return _this3.finish(_this3);
          });
      }
    }
  }, {
    key: 'copy',
    value: function copy(callback) {
      // let srcpath = this.src.type === 'fruitmix' ? this.data.findNodeByUUID(path.basename(this.src.path)) : 
      // TODO to join ext path Jack
      _child_process2.default.exec('cp -r --reflink=auto ' + this.src + ' ' + this.dst, function (err, stdout, stderr) {
        if (err) return callback(err);
        if (stderr) return callback(stderr);
        return callback(null, stdout);
      });
    }
  }, {
    key: 'delete',
    value: function _delete(callback) {
      // TODO  join Path Jack
      _child_process2.default.exec('rm -rf ' + this.src, function (err, stdout, stderr) {
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
      this.visit(this.src, { type: 'user.fruitmix' }, clean, callback);
    }
  }, {
    key: 'move',
    value: function move(callback) {
      _child_process2.default.exec('mv -f ' + this.src + ' ' + this.dst, function (err, stdout, stderr) {
        if (err) return callback(err);
        if (stderr) return callback(stderr);
        return callback(null, stdout);
      });
    }
  }, {
    key: 'visit',
    value: function (_visit) {
      function visit(_x, _x2, _x3, _x4) {
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

    var _this4 = (0, _possibleConstructorReturn3.default)(this, (Copy.__proto__ || (0, _getPrototypeOf2.default)(Copy)).call(this));

    _this4.src = src;
    _this4.dst = dst;
    _this4.tmp = tmp;
    _this4.data = data;
    _this4.userUUID = userUUID;
    return _this4;
  }

  (0, _createClass3.default)(Copy, [{
    key: 'cleanUp',
    value: function cleanUp() {}
  }, {
    key: 'run',
    value: function run() {
      var _this5 = this;

      if (this.state !== 'PADDING') return;
      this.state = 'RUNNING';
      var srcType = isFruitmix(this.src);
      var dstType = isFruitmix(this.dst);

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
        if (_this5.finished) return;
        if (err) return _this5.error(err);
        _fs2.default.rename(_this5.tmp, _this5.dst, function (err) {
          if (_this5.finished) return;
          if (err) return _this5.error(err);
          if (modeType === 'FF') {
            var srcNode = _this5.data.findNodeByUUID(_path2.default.basename(_this5.src));
            var dstNode = _this5.data.findNodeByUUID(_path2.default.basename(_this5.dst));
            if (srcNode) _this5.data.requestProbeByUUID(srcNode.parent);
            if (dstNode) _this5.data.requestProbeByUUID(dstNode.uuid);
          } //probe src dst
          if (modeType === 'EF') {
            var _dstNode = _this5.data.findNodeByUUID(_path2.default.basename(_this5.dst));
            if (_dstNode) _this5.data.requestProbeByUUID(_dstNode.uuid);
          } //probe dst
          return _this5.finish(_this5);
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
        return !worker.isRunning();
      }).slice(0, diff).forEach(function (worker) {
        return worker.start();
      });
    }
  }, {
    key: 'createMove',
    value: function createMove(_ref, callback) {
      var _this6 = this;

      var src = _ref.src,
          dst = _ref.dst,
          userUUID = _ref.userUUID;

      createMoveWorker(src, dst, this.data, userUUID, function (err, worker) {
        if (err) return callback(ett);
        worker.on('finish', function (worker) {
          worker.state = 'FINISHED';
          _this6.schedule();
        });
        worker.on('error', function (worker) {
          worker.state = 'WARNING';
          _this6.workersQueue.splice(_this6.workersQueue.indexOf(worker), 1);
          _this6.warningQueue.push(worker);
          _this6.schedule();
        });
        _this6.workersQueue.push(worker);
        callback(null, worker);
        _this6.schedule();
      });
    }
  }, {
    key: 'createCopy',
    value: function createCopy(_ref2, callback) {
      var _this7 = this;

      var src = _ref2.src,
          dst = _ref2.dst,
          userUUID = _ref2.userUUID;

      createCopyWorker(src, dst, this.data, userUUID, function (err, worker) {
        if (err) return callback(err);
        worker.on('finish', function (worker) {
          worker.state = 'FINISHED';
          _this7.schedule();
        });
        worker.on('error', function (worker) {
          worker.state = 'WARNING';
          _this7.workersQueue.splice(_this7.workersQueue.indexOf(worker), 1);
          _this7.warningQueue.push(worker);
          _this7.schedule();
        });
        _this7.workersQueue.push(worker);
        _this7.schedule();
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
    value: function abortWorker(_ref3, callback) {
      var userUUID = _ref3.userUUID,
          workerId = _ref3.workerId;

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
  if (_fs2.default.existsSync(src) && _fs2.default.existsSync(dst)) {
    var worker = new Move(src, dst, data);
    return callback(null, worker);
  }
  return callback(new Error('path not exists'));
};

var createCopyWorker = function createCopyWorker(src, dst, data, userUUID, callback) {
  var tmp = _path2.default.join(_config2.default.path, 'tmp'); //TODO Get tmp folder Jack
  if (_fs2.default.existsSync(src) && _fs2.default.existsSync(dst)) {
    var worker = new Copy(src, dst, tmp, data);
    return callback(null, worker);
  }
  return callback(new Error('path not exists'));
};

exports.default = Transfer;