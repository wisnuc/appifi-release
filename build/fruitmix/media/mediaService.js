'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _thumb = require('./thumb');

var _thumb2 = _interopRequireDefault(_thumb);

var _config = require('../cluster/config');

var _config2 = _interopRequireDefault(_config);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var tb = new _thumb2.default(40);

module.exports = function () {
  function MediaService(model, fileData, fileShareData, mediaData, mediaShareData) {
    (0, _classCallCheck3.default)(this, MediaService);


    this.model = model;
    this.fileData = fileData;
    this.fileShareData = fileShareData;
    this.mediaData = mediaData;
    this.mediaShareData = mediaShareData;
  }

  // determine whether local users


  (0, _createClass3.default)(MediaService, [{
    key: 'isLocalUser',
    value: function () {
      var _ref = (0, _bluebird.method)(function (useruuid) {
        // find user by uuid
        var user = this.model.users.find(function (u) {
          return u.uuid === useruuid;
        });
        if (!user) throw new Error('user not found');
        return user.type === 'local';
      });

      function isLocalUser(_x) {
        return _ref.apply(this, arguments);
      }

      return isLocalUser;
    }()
  }, {
    key: 'findMediaPath',
    value: function findMediaPath(digest) {

      var media = this.mediaData.findMediaByHash(digest);
      if (!media) throw new _error2.default.ENOENT();

      var nodes = (0, _from2.default)(media.nodes);
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(nodes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var n = _step.value;

          return n.abspath();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'getMeta',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(userUUID) {
        var user, allMedia;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _bluebird.resolve)(this.isLocalUser(userUUID));

              case 2:
                user = _context.sent;

                if (user) {
                  _context.next = 5;
                  break;
                }

                throw new _error2.default.EACCESS();

              case 5:
                allMedia = this.mediaData.getAllMedia(userUUID);
                return _context.abrupt('return', allMedia);

              case 7:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function getMeta(_x2) {
        return _ref2.apply(this, arguments);
      }

      return getMeta;
    }()

    // need to check authorazation 

  }, {
    key: 'readMedia',
    value: function () {
      var _ref3 = (0, _bluebird.method)(function (_ref4) {
        var userUUID = _ref4.userUUID,
            digest = _ref4.digest;


        var media = this.mediaData.findMediaByHash(digest);
        if (!media) throw new _error2.default.ENOENT();

        var props = this.mediaData.mediaProperties(userUUID, media);
        if (props.permittedToShare || props.authorizedToRead || props.sharedWithOthers || props.sharedWithMe) {
          return this.findMediaPath(digest);
        } else {
          throw new _error2.default.ENOENT();
        }
      });

      function readMedia(_x3) {
        return _ref3.apply(this, arguments);
      }

      return readMedia;
    }()
  }, {
    key: 'getThumb',
    value: function getThumb(_ref5, callback) {
      var requestId = _ref5.requestId,
          digest = _ref5.digest,
          query = _ref5.query;


      var src = this.findMediaPath(digest);
      tb.request({ requestId: requestId, src: src, digest: digest, query: query }, function (err, data) {
        if (err) return callback(err);

        return callback(null, data);
      });
    }
  }, {
    key: 'abort',
    value: function abort(_ref6, callback) {
      var requestId = _ref6.requestId,
          digest = _ref6.digest,
          query = _ref6.query;


      tb.abort({ requestId: requestId, digest: digest, query: query });
      callback(null, true);
    }
  }, {
    key: 'register',
    value: function register(ipc) {
      var _this = this;

      ipc.register('getMeta', function (args, callback) {
        return _this.getMeta(args).asCallback(callback);
      });
      ipc.register('readMedia', function (args, callback) {
        return _this.readMedia(args).asCallback(callback);
      });
      ipc.register('getThumb', this.getThumb.bind(this));
      ipc.register('abort', this.abort.bind(this));
    }
  }]);
  return MediaService;
}();