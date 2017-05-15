'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteFileMap = exports.readFileMap = exports.readFileMapList = exports.updateSegmentAsync = exports.SegmentUpdater = exports.createFileMap = undefined;

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

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _paths = require('./paths');

var _paths2 = _interopRequireDefault(_paths);

var _error = require('../../lib/error');

var _error2 = _interopRequireDefault(_error);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _async = require('../../../common/async');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FILEMAP = 'user.filemap';

var createFileMapAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(_ref2) {
    var size = _ref2.size,
        segmentsize = _ref2.segmentsize,
        dirUUID = _ref2.dirUUID,
        sha256 = _ref2.sha256,
        name = _ref2.name,
        userUUID = _ref2.userUUID;
    var folderPath, taskId, filepath, segments, i, attr;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // fallocate -l 10G bigfile
            folderPath = _path2.default.join(_paths2.default.get('filemap'), userUUID);
            _context.prev = 1;
            _context.next = 4;
            return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(folderPath));

          case 4:
            taskId = _nodeUuid2.default.v4();
            filepath = _path2.default.join(folderPath, taskId);
            _context.next = 8;
            return (0, _bluebird.resolve)(_child_process2.default.execAsync('fallocate -l ' + size + ' ' + filepath));

          case 8:
            segments = [];

            for (i = 0; i < Math.ceil(size / segmentsize); i++) {
              segments.push(0);
            }
            attr = { size: size, segmentsize: segmentsize, segments: segments, dirUUID: dirUUID, sha256: sha256, name: name, userUUID: userUUID };
            _context.next = 13;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(filepath, FILEMAP, (0, _stringify2.default)(attr)));

          case 13:
            return _context.abrupt('return', (0, _assign2.default)({}, attr, { taskid: taskId }));

          case 16:
            _context.prev = 16;
            _context.t0 = _context['catch'](1);
            throw _context.t0;

          case 19:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[1, 16]]);
  }));

  return function createFileMapAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

var deleteFileMap = function deleteFileMap(userUUID, taskId, callback) {
  var filePath = _path2.default.join(_paths2.default.get('filemap'), userUUID, taskId);
  _fs2.default.lstat(filePath, function (err) {
    if (err) return callback(err);
    _fs2.default.unlink(filePath, function (err) {
      if (err) return callback(err);
      callback(null);
    });
  });
};

var readFileMapList = function readFileMapList(userUUID, callback) {
  var folderPath = _path2.default.join(_paths2.default.get('filemap'), userUUID);
  _fs2.default.readdir(folderPath, function (err, list) {
    if (err) return callback(err);
    return callback(null, list.map(function (f) {
      try {
        var attr = JSON.parse(_fsXattr2.default.getSync(_path2.default.join(folderPath, f), FILEMAP));
        if (attr) return (0, _assign2.default)({}, attr, { taskid: f });
        return undefined;
      } catch (e) {
        return undefined;
      }
    }));
  });
};

var readFileMap = function readFileMap(userUUID, taskId, callback) {
  var fpath = _path2.default.join(_paths2.default.get('filemap'), userUUID, taskId);
  if (_fs2.default.existsSync(fpath)) {
    _fsXattr2.default.get(fpath, FILEMAP, function (err, attr) {
      if (err) return callback(err);
      try {
        return callback(null, (0, _assign2.default)({}, JSON.parse(attr), { taskid: taskId }));
      } catch (e) {
        callback(e);
      }
    });
  } else return callback(new Error('filemap not find'));
};

var SegmentUpdater = function (_EventEmitter) {
  (0, _inherits3.default)(SegmentUpdater, _EventEmitter);

  function SegmentUpdater(target, stream, offset, segmentHash, segmentSize) {
    (0, _classCallCheck3.default)(this, SegmentUpdater);

    var _this = (0, _possibleConstructorReturn3.default)(this, (SegmentUpdater.__proto__ || (0, _getPrototypeOf2.default)(SegmentUpdater)).call(this));

    _this.finished = false;
    _this.target = target;
    _this.stream = stream;
    _this.offset = offset;
    _this.segmentHash = segmentHash;
    _this.segmentSize = segmentSize;
    _this.onStreamCloseEvent = _this.onStreamClose.bind(_this);
    _this.callback = null;
    return _this;
  }

  (0, _createClass3.default)(SegmentUpdater, [{
    key: 'start',
    value: function start(callback) {
      var _this2 = this;

      this.listenStream();
      this.callback = callback;

      var writeStream = _fs2.default.createWriteStream(this.target, { flags: 'r+', start: this.offset });
      var hash = _crypto2.default.createHash('sha256');
      var length = 0;
      var hashTransform = new _stream2.default.Transform({
        transform: function transform(buf, enc, next) {
          length += buf.length;
          if (length > this.segmentSize) {
            this.end();
            return;
          }
          hash.update(buf, enc);
          this.push(buf);
          next();
        }
      });

      hashTransform.on('error', function (err) {
        return _this2.error(err);
      });

      writeStream.on('error', function (err) {
        return _this2.error(err);
      });

      writeStream.on('finish', function () {
        if (_this2.finished) return;
        if (writeStream.bytesWritten !== _this2.segmentSize) {
          return _this2.error(new Error('size error'));
        }

        if (hash.digest('hex') !== _this2.segmentHash) return _this2.error(new Error('hash mismatch'));
        _this2.finish();
      });

      this.stream.pipe(hashTransform).pipe(writeStream);
    }
  }, {
    key: 'startAsync',
    value: function () {
      var _ref3 = (0, _bluebird.method)(function () {
        return _bluebird2.default.promisify(this.start).bind(this)();
      });

      function startAsync() {
        return _ref3.apply(this, arguments);
      }

      return startAsync;
    }()
  }, {
    key: 'error',
    value: function error(err) {
      if (this.finished) return;
      this.finished = true;
      this.cheanUp();
      console.log(err.message);
      // this.emit('error',err)
      if (this.callback) this.callback(err);
    }
  }, {
    key: 'finish',
    value: function finish() {
      if (this.finished) return;
      this.finished = true;
      this.cheanUp();
      // this.emit('finish', null)
      if (this.callback) this.callback(null, 'finish');
    }
  }, {
    key: 'isFinished',
    value: function isFinished() {
      return this.finished;
    }
  }, {
    key: 'listenStream',
    value: function listenStream() {
      if (this.stream) this.stream.on('close', this.onStreamCloseEvent);
    }
  }, {
    key: 'removeListenerStream',
    value: function removeListenerStream() {
      if (this.stream) this.stream.removeListener('close', this.onStreamCloseEvent);
    }
  }, {
    key: 'onStreamClose',
    value: function onStreamClose() {
      return this.isFinished() || this.abort();
    }
  }, {
    key: 'cheanUp',
    value: function cheanUp() {
      this.removeListenerStream();
      // this.callback = null
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.finished) return;
      this.finished = true;
      this.cheanUp();
      this.emit('abort');
    }
  }]);
  return SegmentUpdater;
}(_events2.default);

// 1. retrieve target async yes
// 2. validate segement arguments no
// 3. start worker async
// 4. update file xattr async

var updateSegmentAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(userUUID, nodeUUID, segmentHash, start, taskId, req) {
    var folderPath, fpath, attr, segments, segmentSize, segmentLength, position, updater, fname;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            folderPath = _path2.default.join(_paths2.default.get('filemap'), userUUID);
            fpath = _path2.default.join(folderPath, taskId);
            _context2.t0 = JSON;
            _context2.next = 5;
            return (0, _bluebird.resolve)(_fsXattr2.default.getAsync(fpath, FILEMAP));

          case 5:
            _context2.t1 = _context2.sent;
            attr = _context2.t0.parse.call(_context2.t0, _context2.t1);
            segments = attr.segments;

            if (!(segments.length < start + 1)) {
              _context2.next = 10;
              break;
            }

            throw new _error2.default.EINVAL();

          case 10:
            if (!(segments[start] === 1)) {
              _context2.next = 12;
              break;
            }

            throw new _error2.default.EEXISTS();

          case 12:
            segmentSize = attr.segmentsize;
            segmentLength = segments.length > start + 1 ? segmentSize : attr.size - start * segmentSize;
            position = attr.segmentsize * start;
            updater = new SegmentUpdater(fpath, req, position, segmentHash, segmentLength);
            _context2.next = 18;
            return (0, _bluebird.resolve)(updater.startAsync());

          case 18:
            _context2.t2 = JSON;
            _context2.next = 21;
            return (0, _bluebird.resolve)(_fsXattr2.default.getAsync(fpath, FILEMAP));

          case 21:
            _context2.t3 = _context2.sent;
            attr = _context2.t2.parse.call(_context2.t2, _context2.t3);

            attr.segments[start] = 1;
            _context2.next = 26;
            return (0, _bluebird.resolve)(_fsXattr2.default.setAsync(fpath, FILEMAP, (0, _stringify2.default)(attr)));

          case 26:
            if (!attr.segments.includes(0)) {
              _context2.next = 28;
              break;
            }

            return _context2.abrupt('return', false);

          case 28:
            _context2.next = 30;
            return (0, _bluebird.resolve)(autoRenameAsync(attr.userUUID, attr.dirUUID, attr.name));

          case 30:
            fname = _context2.sent;

            console.log('----------------' + fname);
            _context2.next = 34;
            return (0, _bluebird.resolve)(moveFileMapAsync(attr.userUUID, attr.dirUUID, fname, fpath, attr.sha256));

          case 34:
            return _context2.abrupt('return', true);

          case 35:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function updateSegmentAsync(_x2, _x3, _x4, _x5, _x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();

var autoRename = function autoRename(userUUID, dirUUID, filename, callback) {
  _config2.default.ipc.call('list', { userUUID: userUUID, dirUUID: dirUUID }, function (err, nodes) {
    if (err) return callback(err);
    var files = nodes.map(function (n) {
      return n.name;
    });
    if (!files.includes(filename)) return callback(null, filename);

    var filenameArr = filename.split('.');
    var fn = void 0,
        ftype = false;
    if (filenameArr.length === 1) {
      fn = filename;
    } else {
      ftype = filenameArr.pop();
      fn = filenameArr.join('.');
    }

    var count = 1;
    var fname = fn + '[' + count + ']' + (ftype ? '.' + ftype : '');
    while (files.includes(fname)) {
      count++;
      fname = fn + '[' + count + ']' + (ftype ? '.' + ftype : '');
    }
    return callback(null, fname);
  });
};

var autoRenameAsync = function autoRenameAsync(userUUID, dirUUID, filename) {
  return _bluebird2.default.promisify(autoRename)(userUUID, dirUUID, filename);
};

var moveFileMap = function moveFileMap(userUUID, dirUUID, name, src, hash, callback) {
  // config.ipc.call()
  var args = { userUUID: userUUID, dirUUID: dirUUID, name: name, src: src, hash: hash, check: false };
  _config2.default.ipc.call('createFile', args, function (err, data) {
    if (err) return callback(err);
    return callback(null, data);
  });
};

var moveFileMapAsync = function moveFileMapAsync(userUUID, dirUUID, name, src, hash) {
  return _bluebird2.default.promisify(moveFileMap)(userUUID, dirUUID, name, src, hash);
};

var createFileMap = function createFileMap(_ref5, callback) {
  var size = _ref5.size,
      segmentsize = _ref5.segmentsize,
      dirUUID = _ref5.dirUUID,
      sha256 = _ref5.sha256,
      name = _ref5.name,
      userUUID = _ref5.userUUID;
  return createFileMapAsync({ size: size, segmentsize: segmentsize, dirUUID: dirUUID, sha256: sha256, name: name, userUUID: userUUID }).asCallback(function (e, data) {
    e ? callback(e) : callback(null, data);
  });
};

exports.createFileMap = createFileMap;
exports.SegmentUpdater = SegmentUpdater;
exports.updateSegmentAsync = updateSegmentAsync;
exports.readFileMapList = readFileMapList;
exports.readFileMap = readFileMap;
exports.deleteFileMap = deleteFileMap;