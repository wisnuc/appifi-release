'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFileShareService = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _types = require('../lib/types');

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _fileShareDoc = require('./fileShareDoc');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FileShareService = function () {
  function FileShareService(fileData, fileShareData) {
    (0, _classCallCheck3.default)(this, FileShareService);

    this.fileData = fileData;
    this.fileShareData = fileShareData;
  }

  (0, _createClass3.default)(FileShareService, [{
    key: 'load',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _bluebird.resolve)(this.fileShareData.load());

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function load() {
        return _ref.apply(this, arguments);
      }

      return load;
    }()
  }, {
    key: 'createFileShare',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(userUUID, post) {
        var _this = this;

        var writelist, readlist, collection, doc;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if ((0, _types.isUUID)(userUUID)) {
                  _context2.next = 2;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 2:
                if (!((typeof post === 'undefined' ? 'undefined' : (0, _typeof3.default)(post)) !== 'object' || post === null)) {
                  _context2.next = 4;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 4:

                (0, _types.validateProps)(post, ['writelist', 'readlist', 'collection']);

                writelist = post.writelist, readlist = post.readlist, collection = post.collection;

                // collection format and share permisiion check

                if (Array.isArray(collection)) {
                  _context2.next = 8;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 8:
                if (collection.length) {
                  _context2.next = 10;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 10:
                if (collection.every(_types.isUUID)) {
                  _context2.next = 12;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 12:
                if (collection.every(function (uuid) {
                  var drive = _this.fileData.findNodeByUUID(uuid).getDrive();
                  if (drive.type === 'private') return userUUID === drive.owner;else return drive.shareAllowed && [].concat((0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).includes(userUUID);
                })) {
                  _context2.next = 14;
                  break;
                }

                throw new _error2.default.EACCESS();

              case 14:
                if (Array.isArray(writelist)) {
                  _context2.next = 16;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 16:
                if (writelist.every(_types.isUUID)) {
                  _context2.next = 18;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 18:
                if (Array.isArray(readlist)) {
                  _context2.next = 20;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 20:
                if (readlist.every(_types.isUUID)) {
                  _context2.next = 22;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 22:
                doc = (0, _fileShareDoc.createFileShareDoc)(this.fileData, userUUID, post);
                _context2.next = 25;
                return (0, _bluebird.resolve)(this.fileShareData.createFileShare(doc));

              case 25:
                return _context2.abrupt('return', _context2.sent);

              case 26:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createFileShare(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return createFileShare;
    }()
  }, {
    key: 'updateFileShare',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(userUUID, shareUUID, patch) {
        var _this2 = this;

        var share, newDoc;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if ((0, _types.isUUID)(userUUID)) {
                  _context3.next = 2;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 2:
                if ((0, _types.isUUID)(shareUUID)) {
                  _context3.next = 4;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 4:
                share = this.getFileShareByUUID(shareUUID);

                if (!(share.doc.author !== userUUID)) {
                  _context3.next = 7;
                  break;
                }

                throw new _error2.default.EACCESS();

              case 7:
                if (Array.isArray(patch)) {
                  _context3.next = 9;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 9:
                patch.forEach(function (op) {
                  if ((typeof op === 'undefined' ? 'undefined' : (0, _typeof3.default)(op)) !== 'object') throw new _error2.default.EINVAL();

                  (0, _types.validateProps)(op, ['path', 'operation', 'value']);

                  if ((0, _types.complement)([op.path], ['writelist', 'readlist', 'collection']).length !== 0) throw new _error2.default.EINVAL();
                  if (op.operation !== 'add' && op.operation !== 'delete') throw new _error2.default.EINVAL();

                  if (!Array.isArray(op.value)) throw new _error2.default.EINVAL();
                  if (!op.value.every(_types.isUUID)) throw new _error2.default.EINVAL();

                  if (op.path === 'collection') {
                    if (!op.value.every(function (uuid) {
                      var drive = _this2.fileData.findNodeByUUID(uuid).getDrive();
                      if (drive.type === 'private') return userUUID === drive.owner;else return drive.shareAllowed && [].concat((0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).includes(userUUID);
                    })) throw new _error2.default.EACCESS();
                  }
                });

                newDoc = (0, _fileShareDoc.updateFileShareDoc)(this.fileData, share.doc, patch);
                _context3.next = 13;
                return (0, _bluebird.resolve)(this.fileShareData.updateFileShare(newDoc));

              case 13:
                return _context3.abrupt('return', _context3.sent);

              case 14:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function updateFileShare(_x3, _x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return updateFileShare;
    }()
  }, {
    key: 'deleteFileShare',
    value: function () {
      var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(userUUID, shareUUID) {
        var share;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if ((0, _types.isUUID)(userUUID)) {
                  _context4.next = 2;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 2:
                if ((0, _types.isUUID)(shareUUID)) {
                  _context4.next = 4;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 4:
                share = this.getFileShareByUUID(shareUUID);

                if (!(share.doc.author !== userUUID)) {
                  _context4.next = 7;
                  break;
                }

                throw new _error2.default.EACCESS();

              case 7:
                _context4.next = 9;
                return (0, _bluebird.resolve)(this.fileShareData.deleteMediaShare(shareUUID));

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function deleteFileShare(_x6, _x7) {
        return _ref4.apply(this, arguments);
      }

      return deleteFileShare;
    }()
  }, {
    key: 'getFileShareByUUID',
    value: function getFileShareByUUID(shareUUID) {
      if (!(0, _types.isUUID)(shareUUID)) throw new _error2.default.EINVAL();
      var share = this.fileShareData.findShareByUUID(shareUUID);
      if (share) return share;else throw new _error2.default.ENOENT();
    }
  }, {
    key: 'getUserFileShares',
    value: function () {
      var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(userUUID) {
        var _this3 = this;

        var shares, shares_1;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if ((0, _types.isUUID)(userUUID)) {
                  _context5.next = 2;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 2:
                _context5.next = 4;
                return (0, _bluebird.resolve)(this.fileShareData.getUserFileShares(userUUID));

              case 4:
                shares = _context5.sent;
                shares_1 = [];

                shares.forEach(function (share) {
                  var map = new _map2.default();
                  share.doc.collection.forEach(function (u) {
                    var props = {
                      writeable: false,
                      readable: false,
                      shareable: false
                    };

                    if (_this3.fileData.userPermittedToShareByUUID(userUUID, u)) props.shareable = true;

                    if (_this3.fileData.userPermittedToShareByUUID(share.doc.author, u)) {
                      if (_this3.fileData.userPermittedToReadByUUID(share.doc.author, u) && (share.doc.author === userUUID || share.userAuthorizedToRead(userUUID))) props.readable = true;

                      if (_this3.fileData.userPermittedToWriteByUUID(share.doc.author, u) && (share.doc.author === userUUID || share.userAuthorizedToWrite(userUUID))) props.writeable = true;
                    }

                    map.set(u, { uuid: u, props: props });
                  });

                  var doc = (0, _assign2.default)({}, share.doc);
                  delete doc.collection;
                  doc.collection = map;
                  var item = { digest: share.digest, doc: doc };
                  shares_1.push(item);
                });
                return _context5.abrupt('return', shares_1);

              case 8:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function getUserFileShares(_x8) {
        return _ref5.apply(this, arguments);
      }

      return getUserFileShares;
    }()
  }, {
    key: 'register',
    value: function register(ipc) {
      var _this4 = this;

      ipc.register('getUserFileShares', function (args, callback) {
        return _this4.getUserFileShares(args.userUUID).asCallback(callback);
      });

      ipc.register('createFileShare', function (args, callback) {
        return _this4.createFileShare(args.userUUID, args.props).asCallback(callback);
      });

      ipc.register('updateFileShare', function (args, callback) {
        return _this4.updateFileShare(args.userUUID, args.shareUUID, args.props).asCallback(callback);
      });

      ipc.register('deleteFileShare', function (args, callback) {
        return _this4.deleteFileShare(args.userUUID, args.shareUUID).asCallback(callback);
      });
    }
  }]);
  return FileShareService;
}();

var createFileShareService = function createFileShareService(fileData, fileShareData) {
  return new FileShareService(fileData, fileShareData);
};

exports.createFileShareService = createFileShareService;