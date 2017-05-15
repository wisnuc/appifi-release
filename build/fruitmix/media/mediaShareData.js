'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMediaShareData = undefined;

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _deepFreeze = require('deep-freeze');

var _deepFreeze2 = _interopRequireDefault(_deepFreeze);

var _mediaShareDoc = require('./mediaShareDoc');

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _types = require('../lib/types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
  indexShare(share) {

    this.shareMap.set(share.doc.uuid, share)

    share.doc.contents.forEach(item => {
      let shareSet = this.mediaMap.get(item.digest)
      if(shareSet) {
        shareSet.add(share)
      } else {
        shareSet = new Set()
        shareSet.add(share)
        this.mediaMap.set(item.digest, shareSet)
      }
    })
  }
**/

/**
  unIndexShare(share) {

    share.doc.contents.forEach(item => {
      let shareSet = this.mediaMap.get(item.digest)
      shareSet.delete(share)
    })

    this.shareMap.delete(share.doc.uuid)
  }
**/

/**
  a share object 
  {
    digest: xxx
    doc: {
      ... // a share doc
    }
    lock: true or undefined // default to undefined
  }
**/

var MediaShare = function () {
  function MediaShare(digest, doc) {
    (0, _classCallCheck3.default)(this, MediaShare);


    this.digest = digest;
    this.doc = doc;

    (0, _deepFreeze2.default)(this);
  }

  (0, _createClass3.default)(MediaShare, [{
    key: 'userAuthorizedToRead',
    value: function userAuthorizedToRead(userUUID) {
      return [].concat((0, _toConsumableArray3.default)(this.doc.maintainers), (0, _toConsumableArray3.default)(this.doc.viewers)).includes(userUUID);
    }
  }, {
    key: 'userAuthorizedToWrite',
    value: function userAuthorizedToWrite(userUUID) {
      return [].concat((0, _toConsumableArray3.default)(this.doc.maintainers)).includes(userUUID);
    }
  }]);
  return MediaShare;
}(); //
// This file provides mediaShare class, which refers to mediaShareDoc internally.
// mediaShare class is responsible for 

// class: mediashare, doc
// singleton: mediashare collection (class -> singleton)
//
// external 


var invariantProps = function invariantProps(c, n, props) {
  props.forEach(function (prop) {
    (0, _types.assert)(c[prop] === n[prop], 'invariant has changed');
  });
};

var invariantUpdate = function invariantUpdate(c, n) {

  invariantProps(c, n, ['doctype', 'docversion', 'uuid', 'author', 'sticky', 'ctime']);

  c.contents.forEach(function (cc) {
    var nc = n.contents.find(function (x) {
      return x.digest === cc.digest;
    });
    if (nc) {
      invariantProps(cc, nc, ['creator', 'ctime']);
    }
  });
};

var MediaShareData = function (_EventEmitter) {
  (0, _inherits3.default)(MediaShareData, _EventEmitter);

  function MediaShareData(modelData, mediaShareStore) {
    (0, _classCallCheck3.default)(this, MediaShareData);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MediaShareData.__proto__ || (0, _getPrototypeOf2.default)(MediaShareData)).call(this));

    _this.modelData = modelData;
    _this.mediaShareStore = mediaShareStore;
    _this.mediaShareMap = new _map2.default();
    _this.lockSet = new _set2.default();
    return _this;
  }

  (0, _createClass3.default)(MediaShareData, [{
    key: 'getLock',
    value: function getLock(uuid) {
      if (this.lockSet.has(uuid)) throw new _error2.default.ELOCK();
      this.lockSet.add(uuid);
    }
  }, {
    key: 'putLock',
    value: function putLock(uuid) {
      if (!this.lockSet.has(uuid)) throw new _error2.default.ELOCK();
      this.lockSet.delete(uuid);
    }
  }, {
    key: 'storeAsync',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(doc) {
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                this.getLock(doc.uuid);
                _context.prev = 1;
                _context.next = 4;
                return (0, _bluebird.resolve)(this.mediaShareStore.storeAsync(doc));

              case 4:
                return _context.abrupt('return', _context.sent);

              case 5:
                _context.prev = 5;

                this.putLock(doc.uuid);
                return _context.finish(5);

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[1,, 5, 8]]);
      }));

      function storeAsync(_x) {
        return _ref.apply(this, arguments);
      }

      return storeAsync;
    }()
  }, {
    key: 'archiveAsync',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(uuid) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:

                this.getLock(uuid);
                _context2.prev = 1;
                _context2.next = 4;
                return (0, _bluebird.resolve)(this.mediaShareStore.archiveAsync(uuid));

              case 4:
                return _context2.abrupt('return', _context2.sent);

              case 5:
                _context2.prev = 5;

                this.putLock(uuid);
                return _context2.finish(5);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1,, 5, 8]]);
      }));

      function archiveAsync(_x2) {
        return _ref2.apply(this, arguments);
      }

      return archiveAsync;
    }()
  }, {
    key: 'findShareByUUID',
    value: function findShareByUUID(uuid) {
      return this.mediaShareMap.get(uuid);
    }
  }, {
    key: 'load',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
        var _this2 = this;

        var shares;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return (0, _bluebird.resolve)(this.mediaShareStore.retrieveAllAsync());

              case 2:
                shares = _context3.sent;

                shares.forEach(function (share) {
                  _this2.mediaShareMap.set(share.doc.uuid, share);
                });
                this.emit('mediaShareCreated', shares);

              case 5:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function load() {
        return _ref3.apply(this, arguments);
      }

      return load;
    }()
  }, {
    key: 'createMediaShare',
    value: function () {
      var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(doc) {
        var digest, share;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                (0, _mediaShareDoc.validateMediaShareDoc)(doc, this.modelData.users);

                _context4.next = 3;
                return (0, _bluebird.resolve)(this.storeAsync(doc));

              case 3:
                digest = _context4.sent;
                share = new MediaShare(digest, doc);


                this.mediaShareMap.set(doc.uuid, share);
                this.emit('mediaShareCreated', [share]);
                return _context4.abrupt('return', share);

              case 8:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function createMediaShare(_x3) {
        return _ref4.apply(this, arguments);
      }

      return createMediaShare;
    }()
  }, {
    key: 'updateMediaShare',
    value: function () {
      var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(doc) {
        var share, digest, next;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                (0, _mediaShareDoc.validateMediaShareDoc)(doc, this.modelData.users);

                share = this.findShareByUUID(doc.uuid);

                if (share) {
                  _context5.next = 4;
                  break;
                }

                throw new _error2.default.ENOENT();

              case 4:
                // 'uuid not found'

                invariantUpdate(share.doc, doc);

                _context5.next = 7;
                return (0, _bluebird.resolve)(this.storeAsync(doc));

              case 7:
                digest = _context5.sent;
                next = new MediaShare(digest, doc);


                this.emit('mediaShareUpdating', share, next);
                this.mediaShareMap.set(doc.uuid, next);
                this.emit('mediaShareUpdated', share, next);
                return _context5.abrupt('return', next);

              case 13:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function updateMediaShare(_x4) {
        return _ref5.apply(this, arguments);
      }

      return updateMediaShare;
    }()
  }, {
    key: 'deleteMediaShare',
    value: function () {
      var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(uuid) {
        var share;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                share = this.findShareByUUID(uuid);

                if (share) {
                  _context6.next = 3;
                  break;
                }

                throw new _error2.default.ENOENT();

              case 3:
                _context6.next = 5;
                return (0, _bluebird.resolve)(this.archiveAsync(uuid));

              case 5:

                this.emit('mediaShareDeleting', share);
                this.mediaShareMap.delete(uuid);

              case 7:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function deleteMediaShare(_x5) {
        return _ref6.apply(this, arguments);
      }

      return deleteMediaShare;
    }()

    // return all the shares user can view

  }, {
    key: 'getUserMediaShares',
    value: function () {
      var _ref7 = (0, _bluebird.method)(function (userUUID) {
        var shares = [];
        this.mediaShareMap.forEach(function (value, key, map) {
          if (value.doc.author === userUUID || value.doc.maintainers.includes(userUUID) || value.doc.viewers.includes(userUUID)) shares.push(value);
        });
        return shares;
      });

      function getUserMediaShares(_x6) {
        return _ref7.apply(this, arguments);
      }

      return getUserMediaShares;
    }()
  }, {
    key: 'sharedWithOthers',
    value: function sharedWithOthers(userUUID, shareUUID) {
      var share = this.findShareByUUID(shareUUID);
      return share.doc.author === userUUID;
    }
  }, {
    key: 'sharedWithMe',
    value: function sharedWithMe(userUUID, shareUUID) {
      var share = this.findShareByUUID(shareUUID);
      return share.doc.maintainers.includes(userUUID) || share.doc.viewers.includes(userUUID);
    }
  }]);
  return MediaShareData;
}(_events2.default);

var createMediaShareData = function createMediaShareData(modelData, mediaShareStore) {
  (0, _bluebird.promisifyAll)(mediaShareStore);
  return new MediaShareData(modelData, mediaShareStore);
};

exports.createMediaShareData = createMediaShareData;