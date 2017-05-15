'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFileShareData = undefined;

var _bluebird = require('bluebird');

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

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

var _fileShareDoc = require('./fileShareDoc');

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _types = require('../lib/types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FileShare = function () {
  function FileShare(digest, doc) {
    (0, _classCallCheck3.default)(this, FileShare);

    this.digest = digest;
    this.doc = doc;

    (0, _deepFreeze2.default)(this);
  }

  (0, _createClass3.default)(FileShare, [{
    key: 'userAuthorizedToRead',
    value: function userAuthorizedToRead(userUUID) {
      return [].concat((0, _toConsumableArray3.default)(this.doc.writelist), (0, _toConsumableArray3.default)(this.doc.readlist)).includes(userUUID);
    }
  }, {
    key: 'userAuthorizedToWrite',
    value: function userAuthorizedToWrite(userUUID) {
      return this.doc.writelist.includes(userUUID);
    }

    // filter collection
    // author of the share still has permission to share these nodes

  }, {
    key: 'effective',
    value: function effective(fileData) {
      var _this = this;

      return this.doc.collection.filter(function (uuid) {
        return fileData.userPermittedToShareByUUID(_this.doc.author, uuid);
      });
    }
  }]);
  return FileShare;
}();

var invariantProps = function invariantProps(c, n, props) {
  props.forEach(function (prop) {
    (0, _types.assert)(c[prop] === n[prop], 'invariant has changed');
  });
};

var invariantUpdate = function invariantUpdate(c, n) {
  invariantProps(c, n, ['doctype', 'docversion', 'uuid', 'author', 'ctime']);
};

// whether a node is included in a share and still effective
// const nodeIncluded = (share, node, fileData) => {
//   let collection = share.effective(fileData)
//   return collection.find(uuid => node.nodepath().includes(fileData.uuidMap.get(uuid)))
// }

var FileShareData = function (_EventEmitter) {
  (0, _inherits3.default)(FileShareData, _EventEmitter);

  function FileShareData(model, fileShareStore, fileData) {
    (0, _classCallCheck3.default)(this, FileShareData);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (FileShareData.__proto__ || (0, _getPrototypeOf2.default)(FileShareData)).call(this));

    _this2.model = model;
    _this2.fileShareStore = fileShareStore;
    _this2.fileShareMap = new _map2.default();
    _this2.fileData = fileData;
    return _this2;
  }

  (0, _createClass3.default)(FileShareData, [{
    key: 'load',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
        var _this3 = this;

        var fileShares;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _bluebird.resolve)(this.fileShareStore.retrieveAllAsync());

              case 2:
                fileShares = _context.sent;

                fileShares.forEach(function (fileShare) {
                  _this3.fileShareMap.set(fileShare.doc.uuid, fileShare);
                });
                this.emit('fileShareCreated', fileShares);

              case 5:
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

    // return the collection of given share doc

  }, {
    key: 'findShareCollectionByUUID',
    value: function findShareCollectionByUUID(uuid) {
      return this.findShareByUUID(uuid) ? this.findShareByUUID(uuid).doc.collection : null;
    }
  }, {
    key: 'findShareByUUID',
    value: function findShareByUUID(uuid) {
      return this.fileShareMap.get(uuid);
    }

    // for a given share includes given node's ancestor, return the path 
    // from ancestor to given node

  }, {
    key: 'findSharePath',
    value: function findSharePath(shareUUID, nodeUUID) {
      var _this4 = this;

      var share = this.findShareByUUID(shareUUID);
      var namepath = this.fileData.findNodeByUUID(nodeUUID).namepath();
      var sharePath = void 0;

      if (share) {
        var found = share.doc.collection.find(function (uuid) {

          var name = _this4.fileData.findNodeByUUID(uuid).name;

          if (namepath.includes(name)) {
            var index = namepath.indexOf(name);
            return sharePath = namepath.slice(index);
          }
        });
        return found ? sharePath : new _error2.default.ENODENOTFOUND();
      } else {
        return new _error2.default.ENOENT();
      }
    }
  }, {
    key: 'userAuthorizedToRead',
    value: function userAuthorizedToRead(userUUID, node) {
      var _this5 = this;

      // starting from root
      // 1. filter user in ReaderSet and user is not author
      // 2. iterate collection list, find one in nodepath && effective
      var shares = [].concat((0, _toConsumableArray3.default)(this.fileShareMap.values()));

      var _loop = function _loop(i) {
        if (shares[i].userAuthorizedToRead(userUUID)) {
          var collection = shares[i].effective(_this5.fileData);

          var found = collection.find(function (uuid) {
            var n = _this5.fileData.findNodeByUUID(uuid);
            var nodepath = node.nodepath();
            return nodepath.includes(n) && _this5.fileData.userPermittedToRead(shares[i].doc.author, n);
          });
          if (found) return {
              v: true
            };
        }
      };

      for (var i = 0; i < shares.length; i++) {
        var _ret = _loop(i);

        if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
      }
      return false;
    }
  }, {
    key: 'userAuthorizedToWrite',
    value: function userAuthorizedToWrite(userUUID, node) {
      var _this6 = this;

      var shares = [].concat((0, _toConsumableArray3.default)(this.fileShareMap.values()));

      var _loop2 = function _loop2(i) {
        if (shares[i].userAuthorizedToWrite(userUUID)) {
          var collection = shares[i].effective(_this6.fileData);

          var found = collection.find(function (uuid) {
            var n = _this6.fileData.findNodeByUUID(uuid);
            var nodepath = node.nodepath();
            return nodepath.includes(n) && _this6.fileData.userPermittedToWrite(shares[i].doc.author, n);
          });
          if (found) return {
              v: true
            };
        }
      };

      for (var i = 0; i < shares.length; i++) {
        var _ret2 = _loop2(i);

        if ((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object") return _ret2.v;
      }
      return false;
    }
  }, {
    key: 'createFileShare',
    value: function () {
      var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(doc) {
        var digest, fileShare;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:

                (0, _fileShareDoc.validateFileShareDoc)(doc, this.model.users);

                _context2.next = 3;
                return (0, _bluebird.resolve)(this.fileShareStore.storeAsync(doc));

              case 3:
                digest = _context2.sent;
                fileShare = new FileShare(digest, doc);

                this.fileShareMap.set(doc.uuid, fileShare);
                this.emit('fileShareCreated', [fileShare]);
                return _context2.abrupt('return', fileShare);

              case 8:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function createFileShare(_x) {
        return _ref2.apply(this, arguments);
      }

      return createFileShare;
    }()
  }, {
    key: 'updateFileShare',
    value: function () {
      var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(doc) {
        var share, digest, next;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:

                (0, _fileShareDoc.validateFileShareDoc)(doc, this.model.users);

                share = this.findShareByUUID(doc.uuid);

                if (share) {
                  _context3.next = 4;
                  break;
                }

                throw new _error2.default.ENOENT();

              case 4:

                invariantUpdate(share.doc, doc);

                _context3.next = 7;
                return (0, _bluebird.resolve)(this.fileShareStore.storeAsync(doc));

              case 7:
                digest = _context3.sent;
                next = new FileShare(digest, doc);


                this.emit('fileShareUpdating', share, next);
                this.fileShareMap.set(doc.uuid, next);
                this.emit('fileShareUpdated', share, next);
                return _context3.abrupt('return', next);

              case 13:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function updateFileShare(_x2) {
        return _ref3.apply(this, arguments);
      }

      return updateFileShare;
    }()
  }, {
    key: 'deleteFileShare',
    value: function () {
      var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(uuid) {
        var share;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                share = this.findShareByUUID(uuid);

                if (share) {
                  _context4.next = 3;
                  break;
                }

                throw new _error2.default.ENOENT();

              case 3:
                _context4.next = 5;
                return (0, _bluebird.resolve)(this.fileShareStore.archiveAsync(uuid));

              case 5:

                this.emit('fileShareDeleting', share);
                this.fileShareMap.delete(uuid);

              case 7:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function deleteFileShare(_x3) {
        return _ref4.apply(this, arguments);
      }

      return deleteFileShare;
    }()
  }, {
    key: 'getUserFileShares',
    value: function () {
      var _ref5 = (0, _bluebird.method)(function (userUUID) {
        var shares = [];
        this.fileShareMap.forEach(function (value, key, map) {
          if (value.doc.author === userUUID || value.doc.writelist.includes(userUUID) || value.doc.readlist.includes(userUUID)) shares.push(value);
        });
        return shares;
      });

      function getUserFileShares(_x4) {
        return _ref5.apply(this, arguments);
      }

      return getUserFileShares;
    }()
  }]);
  return FileShareData;
}(_events2.default);

var createFileShareData = function createFileShareData(model, fileShareStore, fileData) {
  (0, _bluebird.promisifyAll)(fileShareStore);
  // let fileShareData = new FileShareData(model, fileShareStore, fileData)
  // await fileShareData.load()
  // return fileShareData
  return new FileShareData(model, fileShareStore, fileData);
};

exports.createFileShareData = createFileShareData;