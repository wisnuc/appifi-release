'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

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

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

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

var sha1comments = function sha1comments(comments) {
  var hash = _crypto2.default.createHash('sha1');
  comments.forEach(function (cmt) {
    return hash.update(cmt.author + cmt.datetime + cmt.text);
  });
  return hash.digest('hex');
};

// this function generate a mediashare doc
var createMediaShareDoc = function createMediaShareDoc(userUUID, obj) {
  var maintainers = obj.maintainers,
      viewers = obj.viewers,
      album = obj.album,
      sticky = obj.sticky,
      contents = obj.contents;

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

    var _time = new Date().getTime();
    contents = contents.filter(isSHA256).filter(function (item, index, array) {
      return index === array.indexOf(item);
    }).map(function (digest) {
      return {
        author: userUUID,
        digest: digest,
        time: _time
      };
    });
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
  var maintainers = doc.maintainers,
      viewers = doc.viewers,
      album = doc.album,
      sticky = doc.sticky,
      contents = doc.contents;


  if (userUUID === doc.author) {

    op = ops.find(function (op) {
      return op.path === 'maintainers' && op.op === 'delete';
    });
    if (op && Array.isArray(op.value)) {
      maintainers = subtractUUIDArray(maintainers, sortDedup(isUUID)(op.value));
    }

    op = ops.find(function (op) {
      return op.path === 'maintainers' && op.op === 'add';
    });
    if (op && Array.isArray(op.value)) {
      maintainers = addUUIDArray(maintainers, sortDedup(isUUID)(op.value).filter(function (x) {
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
    }

    op = ops.find(function (op) {
      return op.path === 'contents' && op.op === 'add';
    });
    if (op && Array.isArray(op.value)) {

      var _c = [].concat((0, _toConsumableArray3.default)(contents));
      var _dirty = false;

      sortDedup(isSHA256)(op.value).forEach(function (digest) {
        var index = _c.findIndex(function (x) {
          return x.digest === digest;
        });
        if (index !== -1) return;

        _c.push({
          digest: b,
          creator: userUUID,
          ctime: new Date().getTime()
        });
        _dirty = true;
      });

      if (_dirty) contents = _c;
    }
  }

  if (maintainers === doc.maintainers && viewers === doc.viewers && album === doc.album && sticky === doc.sticky && contents === doc.contents) {

    return doc;
  }

  var update = {
    doctype: doc.doctype,
    docversion: doc.docversion,
    uuid: doc.uuid,
    author: doc.author,
    maintainers: maintainers,
    viewers: viewers,
    album: album,
    sticky: sticky,
    ctime: doc.ctime,
    mtime: new Date().getTime(),
    contents: contents
  };

  return update;
};

var userViewable = function userViewable(share, userUUID) {
  return share.doc.author === userUUID || share.doc.maintainers.indexOf(userUUID) !== -1 || share.doc.viewers.indexOf(userUUID) !== -1;
};

/** 

  The structure of a mediaTalk object should be

  {
    doc: {
      owner: <UUID, string>,
      digest: <SHA256, string>,
      comments: [ // sorted by time
        {
          author: <UUID, string>,
          time: <Integer, number>,
          text: <String>
        },
        ...
      ]
    },
    commentHashMap: null or Map(), author => comment hash    
    digest: document hash
  }

  the property inside doc should be structurally stable (canonicalized)
  the comments should be sorted in creation order (not strictly by time, if time is wrong)

**/

/*****************************************************************************

  shareMap is something like uuid map in forest

    share.doc.uuid => share

  mediaMap is like the digeset => digestObj map in forest, instead of array 
  for nodes, it uses JavaScript Set as collection object for shares

    for each item in a share's contents array

    item.digest => shareSet, which is collections of share  

 *****************************************************************************/

var Media = function (_EventEmitter) {
  (0, _inherits3.default)(Media, _EventEmitter);

  // shareMap stores uuid (key) => share (value)
  // mediaMap stores media/content digest (key) => (containing) share Set (value), each containing share Set contains share
  function Media(shareStore, talkStore) {
    (0, _classCallCheck3.default)(this, Media);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Media.__proto__ || (0, _getPrototypeOf2.default)(Media)).call(this));

    _this.shareStore = shareStore;
    _this.talkStore = talkStore;

    // using an map instead of an array
    _this.shareMap = new _map2.default();
    // using an map instead of an array
    _this.mediaMap = new _map2.default();

    // each (local) talk has its creator and media digest, as its unique identifier
    _this.talks = [];

    // 
    // suspicious
    //
    // each remote talk has its viewer (a local user), creator, and media digest, as its unique identifier
    _this.remoteMap = new _map2.default(); // user -> user's remote talks
    // each talk has creator and media digest as its unique identifier

    // when user V retrieve talks
    // traverse all talks 
    // supposing talk has owner U and digest D
    //   traversing shareSet from mediaMap D => shareSet
    //   if a share author = U, with V as viewable, then add all viewers for this set to SET
    //   this new SET(U, D) containers all authors whose comments can be viewed by V.
    // then XOR hash of user belong to such set 

    // then should we differentiate local and remote users? I think not.

    return _this;
  }

  (0, _createClass3.default)(Media, [{
    key: 'getTalks',
    value: function getTalks(userUUID) {
      var _this2 = this;

      var SHA1 = function SHA1(comments) {

        var hash = _crypto2.default.createHash('sha1');

        filtered.forEach(function (cmt) {
          hash.update(cmt.author);
          hash.update(cmt.datetime);
          hash.update(cmt.text);
        });

        return hash.digest('hex');
      };

      var arr = [];
      this.talks.forEach(function (talk) {
        var _talk$doc = talk.doc,
            owner = _talk$doc.owner,
            digest = _talk$doc.digest;

        if (owner === userUUID) {
          arr.push({ owner: owner, digest: digest, comments: talk.doc.comments, sha1: SHA1(talk.doc.comments) });
        } else {

          var shareSet = _this2.mediaMap.get(digest);
          if (!shareSet) return;

          // fellows (mutual, reciprocal.... see thesaurus.com for more approriate words)
          var fellows = new _set2.default();
          shareSet.forEach(function (share) {
            if (owner === share.doc.author && userViewable(share, userUUID)) {
              fellows.add(share.doc.author);
              share.doc.maintainers.forEach(function (u) {
                return fellows.add(u);
              });
              share.doc.viewers.forEach(function (u) {
                return fellows.add(u);
              });
            }
          });

          // the talk owner did not share anything with you, otherwise, at least himself and you will
          // be in fellows
          if (fellows.size === 0) return;

          var comments = talk.doc.comments.filter(function (cmt) {
            return fellows.has(cmt.author);
          });
          var sha1 = SHA1(comments);
          arr.push({ owner: owner, digest: digest, comments: comments, sha1: sha1 });
        }
      });

      return arr;
    }
  }, {
    key: 'load',
    value: function load() {
      var _this3 = this;

      this.shareStore.retrieveAll(function (err, shares) {
        shares.forEach(function (share) {
          _this3.indexShare(share);
        });
        _this3.emit('shareStoreLoaded');
      });

      this.talkStore.retrieveAll(function (err, talks) {
        talks.forEach(function (talk) {
          _this3.indexTalk(talk);
        });
      });
    }

    // add a share to index maps

  }, {
    key: 'indexShare',
    value: function indexShare(share) {
      var _this4 = this;

      this.shareMap.set(share.doc.uuid, share);
      share.doc.contents.forEach(function (item) {
        var shareSet = _this4.mediaMap.get(item.digest);
        if (shareSet) {
          shareSet.add(share);
        } else {
          shareSet = new _set2.default();
          shareSet.add(share);
          _this4.mediaMap.set(item.digest, shareSet);
        }
      });
    }

    // remove a share out of index maps

  }, {
    key: 'unindexShare',
    value: function unindexShare(share) {
      var _this5 = this;

      this.shareMap.delete(share.doc.uuid);
      share.doc.contents.forEach(function (item) {
        var shareSet = _this5.mediaMap.get(item.digest);
        shareSet.delete(share);
      });
    }

    // create a mediashare object from user provided object
    // FIXME permission check

  }, {
    key: 'createMediaShare',
    value: function createMediaShare(userUUID, obj, callback) {
      var _this6 = this;

      try {
        var doc = createMediaShareDoc(userUUID, obj);
        if (doc instanceof Error) {
          return process.nextTick(callback, doc);
        }

        this.shareStore.store(doc, function (err, share) {
          if (err) return callback(err);
          _this6.indexShare(share);
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
      var _this7 = this;

      try {

        var share = this.shareMap.get(shareUUID);
        if (!share) return callback('ENOENT'); // FIXME

        if (share.doc.author !== userUUID) return callback('EACCESS');

        var doc = updateMediaShareDoc(userUUID, share.doc, ops);
        if (doc === share.doc) return callback(null, share);

        this.shareStore.store(doc, function (err, newShare) {
          if (err) return callback(err);
          _this7.unindexShare(share);
          _this7.indexShare(newShare);
          callback(null, newShare);
        });
      } catch (e) {
        console.log(e);
      }
    }

    // archive a mediashare and unindex
    // FIXME permission check

  }, {
    key: 'deleteMediaShare',
    value: function deleteMediaShare(userUUID, shareUUID, callback) {
      var _this8 = this;

      var share = this.shareMap.get(shareUUID);
      if (!share) return callback('ENOENT');

      this.shareStore.archive(shareUUID, function (err) {
        if (err) return callback(err);
        _this8.unindexShare(share);
        _this8.shareMap.delete(shareUUID);
        callback(null);
      });
    }

    // my share is the one I myself is the creator
    // locally shared with me is the one that I am the viewer but not creator, the creator is a local user
    // remotely shared with me is the one that I am the viewer but not creator, the creator is a remote user

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
  }, {
    key: 'fillMediaMetaMap',
    value: function fillMediaMetaMap(mediaMap, userUUID, filer) {

      this.mediaMap.forEach(function (shareSet, digest) {

        var digestObj = filer.hashMap.get(digest);
        if (!digestObj) return;

        var shareArr = (0, _from2.default)(shareSet);

        // sharedWithOthers if author === userUUID && readable(userUUID), sharedWithOthers 
        // sharedWithMe if author !== userUUID && userUUID viewable && readable(
        var viewable = false;
        var swo = false;
        var swm = false;

        for (var i = 0; i < shareArr.length; i++) {

          if (viewable && swo && swm) break;

          if (userViewable(shareArr[i], userUUID)) viewable = true;else continue;

          var contents = shareArr[i].doc.contents;

          if (!swo && mediaMap.has(digest)) {
            if (contents.find(function (c) {
              return c.digest === digest && c.creator === userUUID;
            })) swo = true;
          }

          if (!swm) {
            if (contents.find(function (c) {
              return c.digest === digest && c.creator !== userUUID && filer.mediaUserReadable(digest, c.creator);
            })) swm = true;
          }
        }

        if (viewable) {
          var obj = mediaMap.get(digest);
          if (obj) {
            obj.sharing = 1 | (swo ? 2 : 0) | (swm ? 4 : 0);
          } else {
            obj = { digest: digest, type: digestObj.type, meta: digestObj.meta };
            obj.sharing = swm ? 4 : 0;
            mediaMap.set(digest, obj);
          }
        }
      });
    }

    /////////////////////////////////////////////////////////////////////////////

  }, {
    key: 'fellowSet',
    value: function fellowSet(userUUID, owner, digest) {

      var fellows = new _set2.default();

      var shareSet = this.mediaMap.get(digest);
      if (!shareSet) return fellows;

      shareSet.forEach(function (share) {
        if (owner === share.doc.author && userViewable(share, userUUID)) {
          fellows.add(share.doc.author);
          share.doc.maintainers.forEach(function (u) {
            return follows.add(u);
          });
          share.doc.viewers.forEach(function (u) {
            return fellows.add(u);
          });
        }
      });

      return fellows;
    }
  }, {
    key: 'retrieveTalk',
    value: function retrieveTalk(userUUID, owner, digest) {

      var talk = this.talks.find(function (t) {
        return t.doc.owner === owner && t.doc.digest === digest;
      });

      if (!talk) return;

      var fellows = this.fellowSet(userUUID, owner, digest);

      if (userUUID === owner) fellows.add(userUUID);

      var comments = talk.doc.comments.filter(function (cmt) {
        return fellows.has(cmt.author);
      });
      var sha1 = sha1comments(comments);
      return { owner: owner, digest: digest, comments: comments, sha1: sha1 };
    }
  }, {
    key: 'addComment',
    value: function addComment(userUUID, owner, digest, text, callback) {
      var _this9 = this;

      // first, there exists a photo with given digest for owner (no it is bypassed) TODO
      // second, there exists a share that AUTHORIZE userUUID to comment on such photo

      var talk = void 0;

      if (userUUID === owner) {} else {
        var shareSet = this.mediaMap.get(digest);
        if (!shareSet) return callback(new Error('not found'));

        var allowed = (0, _from2.default)(shareSet).find(function (share) {
          return share.doc.author === owner || userViewable(share, userUUID);
        });

        if (!allowed) return callback(new Error('not permitted'));

        talk = this.talks.find(function (talk) {
          return talk.doc.owner === owner && talk.doc.digest === digest;
        });
      }

      var doc = void 0;
      if (talk) {
        // found 
        doc = {
          owner: doc.owner,
          digest: doc.digest,
          comments: [].concat((0, _toConsumableArray3.default)(doc.comments), [{
            author: userUUID,
            datetime: new Date().toJSON(),
            text: text
          }])
        };

        this.talkStore.store(doc, function (err, dgdoc) {
          if (err) return callback(err);
          talk.digest = dgdoc.digest;
          talk.doc = dgdoc.doc;
          callback(null, _this9.retrieveTalk(userUUID, owner, digeset));
        });
      } else {

        doc = {
          owner: owner,
          digest: digest,
          comments: [{
            author: userUUID,
            datetime: new Date().toJSON(),
            text: text
          }]
        };

        this.talkStore.store(doc, function (err, newtalk) {
          if (err) return callback(err);
          _this9.talks.push(newtalk);
          callback(null, _this9.retrieveTalk(userUUID, owner, digest));
        });
      }
    }
  }]);
  return Media;
}(_events2.default);

exports.default = function (shareStore, talkStore) {
  var media = new Media(shareStore, talkStore);
  media.load();
  return media;
};