'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMediaShareService = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

var _mediaShareDoc = require('./mediaShareDoc');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MediaShareService = function () {
  function MediaShareService(mediaData, mediaShareData) {
    (0, _classCallCheck3.default)(this, MediaShareService);

    this.mediaData = mediaData;
    this.mediaShareData = mediaShareData;
  }

  (0, _createClass3.default)(MediaShareService, [{
    key: 'load',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _bluebird.resolve)(this.mediaShareData.load());

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
    key: 'findMediaShareByUUID',
    value: function findMediaShareByUUID(shareUUID) {
      if (!(0, _types.isUUID)(shareUUID)) throw new _error2.default.EINVAL();
      var share = this.mediaShareData.findShareByUUID(shareUUID);
      if (share) return share;else throw new _error2.default.ENOENT();
    }

    // return { digest, doc } // for compatibility
    // post should be non-null js object

  }, {
    key: 'createMediaShare',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(userUUID, post) {
        var _this = this;

        var maintainers, viewers, album, contents, doc;
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

                (0, _types.validateProps)(post, ['maintainers', 'viewers', 'album', 'contents']);

                maintainers = post.maintainers, viewers = post.viewers, album = post.album, contents = post.contents;
                // contents format and permission check

                if (Array.isArray(contents)) {
                  _context2.next = 8;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 8:
                if (contents.length) {
                  _context2.next = 10;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 10:
                if (contents.every(_types.isSHA256)) {
                  _context2.next = 12;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 12:
                if (contents.every(function (digest) {
                  return _this.mediaData.mediaShareAllowed(userUUID, digest);
                })) {
                  _context2.next = 14;
                  break;
                }

                throw new _error2.default.EACCESS();

              case 14:
                if (Array.isArray(maintainers)) {
                  _context2.next = 16;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 16:
                if (maintainers.every(_types.isUUID)) {
                  _context2.next = 18;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 18:
                if (Array.isArray(viewers)) {
                  _context2.next = 20;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 20:
                if (viewers.every(_types.isUUID)) {
                  _context2.next = 22;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 22:
                if (!((typeof album === 'undefined' ? 'undefined' : (0, _typeof3.default)(album)) !== 'object')) {
                  _context2.next = 24;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 24:
                if (!album) {
                  _context2.next = 31;
                  break;
                }

                (0, _types.validateProps)(album, ['title'], ['text']);

                if (!(typeof album.title !== 'string')) {
                  _context2.next = 28;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 28:
                if (!album.hasOwnProperty('text')) {
                  _context2.next = 31;
                  break;
                }

                if (!(typeof album.text !== 'string')) {
                  _context2.next = 31;
                  break;
                }

                throw new _error2.default.EINVAL();

              case 31:
                doc = (0, _mediaShareDoc.createMediaShareDoc)(userUUID, post);
                _context2.next = 34;
                return (0, _bluebird.resolve)(this.mediaShareData.createMediaShare(doc));

              case 34:
                return _context2.abrupt('return', _context2.sent);

              case 35:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createMediaShare(_x, _x2) {
        return _ref2.apply(this, arguments);
      }

      return createMediaShare;
    }()

    // return { digest, doc } // for compatibility 
    // patch should be non-null js object

  }, {
    key: 'updateMediaShare',
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
                share = this.findMediaShareByUUID(shareUUID);

                if (!(share.doc.author !== userUUID && share.doc.maintainers.indexOf(userUUID) === -1)) {
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

                  if ((0, _types.complement)([op.path], ['maintainers', 'viewers', 'album', 'contents']).length !== 0) throw new _error2.default.EINVAL();

                  if ((0, _types.complement)([op.path], ['maintainers', 'viewers', 'contents']).length === 0) {
                    if (op.operation !== 'add' && op.operation !== 'delete') throw new _error2.default.EINVAL();
                    if (!Array.isArray(op.value)) throw new _error2.default.EINVAL();
                    if (op.path === 'contents') {
                      if (!op.value.every(_types.isSHA256)) throw new _error2.default.EINVAL();
                      if (!op.value.every(function (digest) {
                        return _this2.mediaData.mediaShareAllowed(userUUID, digest);
                      })) throw new _error2.default.EACCESS();
                    } else {
                      if (!op.value.every(_types.isUUID)) throw new _error2.default.EINVAL();
                    }
                  } else {
                    if (op.operation !== 'update') throw new _error2.default.EINVAL();
                    if ((0, _typeof3.default)(op.value) !== 'object') throw new _error2.default.EINVAL();
                    if (op.value) {
                      (0, _types.validateProps)(op.value, ['title'], ['text']);
                      if (typeof op.value.title !== 'string') throw new _error2.default.EINVAL();
                      if (op.value.hasOwnProperty('text')) {
                        if (typeof op.value.text !== 'string') throw new _error2.default.EINVAL();
                      }
                    }
                  }
                });

                newDoc = (0, _mediaShareDoc.updateMediaShareDoc)(userUUID, share.doc, patch);
                _context3.next = 13;
                return (0, _bluebird.resolve)(this.mediaShareData.updateMediaShare(newDoc));

              case 13:
                return _context3.abrupt('return', _context3.sent);

              case 14:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function updateMediaShare(_x3, _x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return updateMediaShare;
    }()

    // return undefined, never fail, idempotent

  }, {
    key: 'deleteMediaShare',
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
                share = this.findMediaShareByUUID(shareUUID);

                if (!(share.doc.author !== userUUID)) {
                  _context4.next = 7;
                  break;
                }

                throw new _error2.default.EACCESS();

              case 7:
                _context4.next = 9;
                return (0, _bluebird.resolve)(this.mediaShareData.deleteMediaShare(shareUUID));

              case 9:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function deleteMediaShare(_x6, _x7) {
        return _ref4.apply(this, arguments);
      }

      return deleteMediaShare;
    }()
  }, {
    key: 'getUserMediaShares',
    value: function () {
      var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(userUUID) {
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
                return (0, _bluebird.resolve)(this.mediaShareData.getUserMediaShares(userUUID));

              case 4:
                shares = _context5.sent;
                shares_1 = [];

                shares.forEach(function (share) {
                  var item = (0, _assign2.default)({}, share);
                  item.readable = userUUID === share.doc.author || share.userAuthorizedToRead(userUUID);
                  item.writeable = userUUID === share.doc.author || share.userAuthorizedToWrite(userUUID);
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

      function getUserMediaShares(_x8) {
        return _ref5.apply(this, arguments);
      }

      return getUserMediaShares;
    }()
  }, {
    key: 'register',
    value: function register(ipc) {
      var _this3 = this;

      ipc.register('getUserMediaShares', function (args, callback) {
        return _this3.getUserMediaShares(args.userUUID).asCallback(callback);
      });

      ipc.register('createMediaShare', function (args, callback) {
        return _this3.createMediaShare(args.userUUID, args.props).asCallback(callback);
      });

      ipc.register('updateMediaShare', function (args, callback) {
        return _this3.updateMediaShare(args.userUUID, args.shareUUID, args.props).asCallback(callback);
      });

      ipc.register('deleteMediaShare', function (args, callback) {
        return _this3.deleteMediaShare(args.userUUID, args.shareUUID).asCallback(callback);
      });
    }
  }]);
  return MediaShareService;
}(); // for all operations, user should be valid, shareUUID should be validated by caller (rest router)

var createMediaShareService = function createMediaShareService(mediaData, mediaShareData) {
  return new MediaShareService(mediaData, mediaShareData);
};

exports.createMediaShareService = createMediaShareService;