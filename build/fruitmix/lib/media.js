'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

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

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**

  a share doc

  {
    doctype: 'mediashare',
    docversion: '1.0'

    uuid: xxxx,

    author: xxxx,
*   maintainers: [], // 0..n 
*   viewers: [], // 0..n

*   album: null or object { title, text }
*   sticky: true or false,
    
    ctime: xxxx,
    mtime: xxxx,

    contents: [
      {
*       digest: xxxx
        creator: xxxx
        ctime: xxxx
      }
    ]
  }

  a share object 
  {
    digest: xxx
    doc: {
      ... // a share doc
    }
  }
**/

var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' ? _validator2.default.isUUID(uuid) : false;
};
var isSHA256 = function isSHA256(sha256) {
  return typeof sha256 === 'string' ? /[a-f0-9]{64}/.test(sha256) : false;
};

// this function generate a mediashare doc
var createMediaShareDoc = function createMediaShareDoc(userUUID, obj) {
  var maintainers = obj.maintainers;
  var viewers = obj.viewers;
  var album = obj.album;
  var sticky = obj.sticky;
  var contents = obj.contents;

  // FIXME

  maintainers = [];

  if (!Array.isArray(viewers)) viewers = [];

  // validate, sort, dedup, and must not be the user itself
  viewers = viewers.filter(isUUID).filter(function (viewer) {
    return viewer !== userUUID;
  }) // remove self ?
  .sort().filter(function (item, index, array) {
    return !index || item !== array[index - 1];
  });

  // album must be true or false, defaults to false
  if (!album) album = null;else {

    //  {
    //    title: string
    //    text: string
    //  }

    var _obj = {};
    if (typeof album.title === 'string') _obj.title = album.title;else _obj.title = '';

    if (typeof album.text === 'string') _obj.text = album.text;else _obj.text = '';

    album = _obj;
  }

  // sticky must be true or false, defaults to false
  if (typeof sticky !== 'boolean') sticky = false;

  if (!Array.isArray(contents)) contents = [];else {
    (function () {

      var time = new Date().getTime();
      contents = contents.filter(isSHA256).filter(function (item, index, array) {
        return index === array.indexOf(item);
      }).map(function (digest) {
        return {
          author: userUUID,
          digest: digest,
          time: time
        };
      });
    })();
  }

  if (!contents.length) {
    var error = new Error('contents invalid');
    error.code = 'EINVAL';
    return error;
  }

  var time = new Date().getTime();

  return {
    doctype: 'mediashare',
    docversion: '1.0',
    uuid: _nodeUuid2.default.v4(),
    author: userUUID,
    maintainers: maintainers,
    viewers: viewers,
    album: album,
    sticky: sticky,
    ctime: time,
    mtime: time,
    contents: contents
  };
};

/**
  each op contains:
  {
    op: 'add', 'delete', or 'update', add, delete for array, update for non-array
  }
**/

var sortDedup = function sortDedup(isType) {
  return function (arr) {
    return [].concat((0, _toConsumableArray3.default)(arr)).filter(isType).sort().filter(function (item, index, arr) {
      return !index || item !== arr[index - 1];
    });
  };
};

var subtractUUIDArray = function subtractUUIDArray(a, b) {

  var aa = [].concat((0, _toConsumableArray3.default)(a));
  var dirty = false;

  b.forEach(function (item) {
    var index = aa.indexOf(item);
    if (index !== -1) {
      dirty = true;
      aa.splice(index, 1);
    }
  });

  return dirty ? aa : a;
};

var subtractContentArray = function subtractContentArray(userUUID, a, b) {

  var aa = [].concat((0, _toConsumableArray3.default)(a));
  var dirty = false;

  b.forEach(function (digest) {
    var index = aa.findIndex(function (x) {
      return x.digest === digest;
    });
    if (index !== -1) {
      dirty = true;
      aa.splice(index, 1);
    }
  });

  return dirty ? aa : a;
};

var addUUIDArray = function addUUIDArray(a, b) {

  var c = sortDedup(isUUID)([].concat((0, _toConsumableArray3.default)(a), (0, _toConsumableArray3.default)(b)));
  return (0, _deepEqual2.default)(a, c) ? a : c;
};

var updateMediaShareDoc = function updateMediaShareDoc(userUUID, doc, ops) {

  var op = void 0;
  var maintainers = doc.maintainers;
  var viewers = doc.viewers;
  var album = doc.album;
  var sticky = doc.sticky;
  var contents = doc.contents;


  if (userUUID === doc.author) {

    op = ops.find(function (op) {
      return op.path === 'maintainers' && op.op === 'delete';
    });
    if (op && Array.isArray(op.value)) {
      maintainers = subtractUUIDArrray(maintainers, sortDedup(isUUID)(op.value));
    }

    op = ops.find(function (op) {
      return op.path === 'maintainers' && op.op === 'add';
    });
    if (op && Array.isArray(op.value)) {
      maintainers = addUUIDArray(maintainers, sortDedup(isSHA256)(op.value).filter(function (x) {
        return x !== doc.author;
      }));
    }

    op = ops.find(function (op) {
      return op.path === 'viewers' && op.op === 'delete';
    });
    if (op && Array.isArray(op.value)) {
      viewers = subtractUUIDArray(viewers, sortDedup(isUUID)(op.value));
    }

    op = ops.find(function (op) {
      return op.path === 'viewers' && op.op === 'add';
    });
    if (op && Array.isArray(op.value)) {
      viewers = addUUIDArray(viewers, sortDedup(isUUID)(op.value).filter(function (x) {
        return x !== doc.author;
      }));
    }

    op = ops.find(function (op) {
      return op.path === 'album' && op.op === 'replace';
    });
    if (op && (0, _typeof3.default)(op.value) === 'object') {
      var title = typeof op.value.title === 'string' ? op.value.title : '';
      var text = typeof op.value.text === 'string' ? op.value.text : '';

      if (title !== album.title || text !== album.text) album = { title: title, text: text };
    }

    op = ops.find(function (op) {
      return op.path === 'sticky' && op.op === 'replace';
    });
    if (op && typeof op.value === 'boolean' && op.value !== sticky) {
      sticky = op.value;
    }
  }

  if (userUUID === doc.author || doc.maintainers.indexOf(userUUID) !== -1) {

    op = ops.find(function (op) {
      return op.path === 'contents' && op.op === 'delete';
    });
    if (op && Array.isArray(op.value)) {
      (function () {

        var c = [].concat((0, _toConsumableArray3.default)(contents));
        var dirty = false;

        sortDedup(isSHA256)(op.value).forEach(function (digest) {
          var index = c.findIndex(function (x) {
            return x.digest === digest && (userUUID === doc.author || userUUID === x.creator);
          });

          if (index !== -1) {
            c.splice(index, 1);
            dirty = true;
          }
        });

        if (dirty) contents = c;
      })();
    }

    op = ops.find(function (op) {
      return op.path === 'contents' && op.op === 'add';
    });
    if (op && Array.isArray(op.value)) {
      (function () {

        var c = [].concat((0, _toConsumableArray3.default)(contents));
        var dirty = false;

        sortDedup(isSHA256)(op.value).forEach(function (digest) {
          var index = c.findIndex(function (x) {
            return x.digest === digest;
          });
          if (index !== -1) return;

          c.push({
            digest: b,
            creator: userUUID,
            ctime: new Date().getTime()
          });
          dirty = true;
        });

        if (dirty) contents = c;
      })();
    }
  }

  if (maintainers === doc.maintainers && viewers === doc.viewers && album === doc.album && sticky === doc.sticky && contents === doc.contents) {

    return doc;
  }

  var update = {
    doctype: doc.doctype,
    docversion: doc.docversion,
    uuid: doc.uuid,
    author: doc.userUUID,
    maintainers: maintainers,
    viewers: viewers,
    album: album,
    sticky: sticky,
    ctime: doc.ctime,
    mtime: new Date().getTime(),
    contents: contents
  };

  // console.log(update)
  return update;
};

var Media = function (_EventEmitter) {
  (0, _inherits3.default)(Media, _EventEmitter);


  // shareMap stores uuid (key) => share (value)
  // mediaMap stores media/content digest (key) => (containing) share Set (value), each containing share Set contains share

  function Media(shareStore, talkStore) {
    (0, _classCallCheck3.default)(this, Media);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Media).call(this));

    _this.shareStore = shareStore;
    _this.talkStore = talkStore;

    // using an map instead of an array
    _this.shareMap = new _map2.default();
    // using an map instead of an array
    _this.mediaMap = new _map2.default();
    // each (local) talk has its creator and media digest, as its unique identifier
    _this.talks = [];
    // each remote talk has its viewer (a local user), creator, and media digest, as its unique identifier
    _this.remoteMap = new _map2.default(); // user -> user's remote talks
    // each talsk has creator and media digest as its unique identifier
    return _this;
  }

  (0, _createClass3.default)(Media, [{
    key: 'load',
    value: function load() {
      var _this2 = this;

      this.shareStore.retrieveAll(function (err, shares) {
        shares.forEach(function (share) {
          _this2.indexShare(share);
        });
        _this2.emit('shareStoreLoaded');
      });
    }

    // add a share to index maps

  }, {
    key: 'indexShare',
    value: function indexShare(share) {
      var _this3 = this;

      this.shareMap.set(share.doc.uuid, share);
      share.doc.contents.forEach(function (item) {
        var shareSet = _this3.mediaMap.get(item.digest);
        if (shareSet) {
          shareSet.add(share);
        } else {
          shareSet = new _set2.default();
          shareSet.add(share);
          _this3.mediaMap.set(item.digest, shareSet);
        }
      });
    }

    // remove a share out of index maps

  }, {
    key: 'unindexShare',
    value: function unindexShare(share) {
      var _this4 = this;

      this.shareMap.delete(share.doc.uuid);
      share.doc.contents.forEach(function (item) {
        var shareSet = _this4.mediaMap.get(item.digest);
        shareSet.delete(share);
      });
    }

    // create a mediashare object from user provided object
    // FIXME permission check

  }, {
    key: 'createMediaShare',
    value: function createMediaShare(userUUID, obj, callback) {
      var _this5 = this;

      try {
        var doc = createMediaShareDoc(userUUID, obj);
        if (doc instanceof Error) {
          return process.nextTick(callback, doc);
        }

        this.shareStore.store(doc, function (err, share) {
          if (err) return callback(err);
          _this5.indexShare(share);
          callback(null, share);
        });
      } catch (e) {
        console.log(e);
      }
    }

    // FIXME permission check

  }, {
    key: 'updateMediaShare',
    value: function updateMediaShare(userUUID, shareUUID, ops, callback) {
      var _this6 = this;

      try {
        var _ret4 = function () {

          var share = _this6.shareMap.get(shareUUID);
          if (!share) return {
              v: callback('ENOENT')
            }; // FIXME

          if (share.doc.author !== userUUID) return {
              v: callback('EACCESS')
            };

          var doc = updateMediaShareDoc(userUUID, share.doc, ops);
          if (doc === share.doc) return {
              v: callback(null, share)
            };

          _this6.shareStore.store(doc, function (err, newShare) {
            if (err) return callback(err);
            _this6.unindexShare(share);
            _this6.indexShare(newShare);
            callback(null, newShare);
          });
        }();

        if ((typeof _ret4 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret4)) === "object") return _ret4.v;
      } catch (e) {
        console.log(e);
      }
    }

    // archive a mediashare and unindex
    // FIXME permission check

  }, {
    key: 'deleteMediaShare',
    value: function deleteMediaShare(userUUID, shareUUID, callback) {
      var _this7 = this;

      var share = this.shareMap.get(shareUUID);
      if (!share) return callback('ENOENT');

      this.shareStore.archive(shareUUID, function (err) {
        if (err) return callback(err);
        _this7.unindexShare(share);
        _this7.shareMap.delete(shareUUID);
        callback(null);
      });
    }

    // my share is the one I myself is the creator
    // locally shared to me is the one that I am the viewer but not creator, the creator is a local user
    // remotely shared to me is the one that I am the viewer but not creator, the creator is a remote user

  }, {
    key: 'getUserShares',
    value: function getUserShares(userUUID) {

      var shares = [];
      this.shareMap.forEach(function (value, key, map) {
        var share = value;
        if (share.doc.author === userUUID || share.doc.maintainers.find(function (u) {
          return u === userUUID;
        }) || share.doc.viewers.find(function (u) {
          return u === userUUID;
        })) shares.push(share);
      });
      return shares;
    }

    // retrieves all media talks I can view

  }, {
    key: 'getMediaTalks',
    value: function getMediaTalks(userUUID) {

      var localTalks = [];
      this.mediaMap.forEach(function (value, key, map) {
        var shareSet = value;
        // first, the user must be either creator or viewer
        // second, if he is creator, get the whole mediatalk
        // if he is not the creator, get only the part he can view
        // push to queue
      });
      return localTalks + remoteTalks;
    }
  }]);
  return Media;
}(_events2.default);

exports.default = function (shareStore, talkStore) {
  var media = new Media(shareStore, talkStore);
  media.load();
  return media;
};