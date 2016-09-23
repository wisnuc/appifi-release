'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

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
var isSHA1 = function isSHA1(sha1) {
  return typeof sha1 === 'string' ? /[a-f0-9]{64}/.test(sha1) : false;
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
  viewers = viewers.filter(function (viewer) {
    return viewer !== userUUID;
  }).filter(isUUID).sort().filter(function (item, index, array) {
    return !index || item !== array[index - 1];
  });

  // album must be true or false, defaults to false
  if (!album) album = null;
  //  {
  //    title: string
  //    text: string
  //  }

  // sticky must be true or false, defaults to false
  if (typeof sticky !== 'boolean') sticky = false;

  if (!Array.isArray(contents)) contents = [];else {
    (function () {

      var time = new Date().getTime();
      contents = contents.filter(isSHA1).filter(function (item, index, array) {
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

var Media = function () {

  // shareMap stores uuid (key) => share (value)
  // mediaMap stores media/content digest (key) => (containing) share Set (value), each containing share Set contains share

  function Media(shareStore, talkStore) {
    (0, _classCallCheck3.default)(this, Media);


    this.shareStore = shareStore;
    this.talkStore = talkStore;

    // using an map instead of an array
    this.shareMap = new _map2.default();
    // using an map instead of an array
    this.mediaMap = new _map2.default();
    // each (local) talk has its creator and media digest, as its unique identifier
    this.talks = [];
    // each remote talk has its viewer (a local user), creator, and media digest, as its unique identifier
    this.remoteMap = new _map2.default(); // user -> user's remote talks
    // each talsk has creator and media digest as its unique identifier
  }

  // add a share to index maps


  (0, _createClass3.default)(Media, [{
    key: 'indexShare',
    value: function indexShare(share) {
      var _this = this;

      this.shareMap.set(share.doc.uuid, share);
      share.doc.contents.forEach(function (item) {
        var shareSet = _this.mediaMap.get(item.digest);
        if (shareSet) {
          shareSet.add(share);
        } else {
          shareSet = new _set2.default();
          shareSet.add(share);
          _this.mediaMap.set(item.digest, shareSet);
        }
      });
    }

    // remove a share out of index maps

  }, {
    key: 'unindexShare',
    value: function unindexShare(share) {
      var _this2 = this;

      this.shareMap.delete(share.doc.uuid);
      share.doc.contents.forEach(function (item) {
        var shareSet = _this2.mediaMap.get(item.digest);
        shareSet.delete(share);
      });
    }

    // create a mediashare object from user provided object
    // FIXME permission check

  }, {
    key: 'createMediaShare',
    value: function createMediaShare(userUUID, obj, callback) {
      var _this3 = this;

      try {
        var _ret2 = function () {
          var doc = createMediaShareDoc(userUUID, obj);
          if (doc instanceof Error) {
            return {
              v: process.nextTick(callback, doc)
            };
          }

          _this3.shareStore.store(doc, function (err, share) {
            if (err) return callback(err);
            _this3.indexShare(share);
            callback(null, doc);
          });
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object") return _ret2.v;
      } catch (e) {
        console.log(e);
      }
    }

    // archive a mediashare and unindex

  }, {
    key: 'deleteMediaShare',
    value: function deleteMediaShare(uuid, callback) {
      var _this4 = this;

      this.shareStore.archive(uuid, function (err) {
        if (err) return callback(err);
        share.contents.forEach(function (cont) {
          var shareSet = _this4.mediaMap.get(cont.digest);
          if (!shareSet) throw new Error('structural error');
          shareSet.delete(share);
          if (shareSet.size === 0) {
            // the last entries for this media's shareSet has been removed
            _this4.mediaMap.delete(cont.digest);
          }
        });

        _this4.shareMap.delete(uuid);
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
}();

exports.default = function (shareStore, talkStore) {
  return new Media(shareStore, talkStore);
};