'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMediaTalkFromDoc = exports.createMediaTalk = undefined;

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
    authorHash: null or Map(), author => comment hash    
    docHash: document hash
  }

  the property inside doc should be structurally stable
  the comments should be sorted by time

**/

var hashObject = function hashObject(obj) {
  var hash = _crypto2.default.createHash('SHA256');
  hash.update((0, _stringify2.default)(obj));
  return hash.digest('hex');
};

var MediaTalkPrototype = function () {

  // assuming store has the save method, requiring owner, digest as parameters
  function MediaTalkPrototype(store) {
    (0, _classCallCheck3.default)(this, MediaTalkPrototype);

    this.store = store;
  }

  (0, _createClass3.default)(MediaTalkPrototype, [{
    key: 'save',
    value: function save(newDoc, callback) {
      this.store.save();
    }
  }, {
    key: 'addComment',
    value: function addComment(author, text, callback) {
      var _this = this;

      // prevent racing
      var doc = this.doc;

      // immutable, order is important, order is irrelevent to timestamp
      var newDoc = {
        owner: doc.owner,
        digest: doc.digest,
        comments: [].concat((0, _toConsumableArray3.default)(doc.comments), [{
          author: author, text: text, time: newDate().getTime()
        }])
      };

      (0, _freeze2.default)(newDoc);

      this.save(newDoc, function (err, docHash) {

        if (err) return callback(err);
        if (doc !== _this.doc) {
          var error = new Error('mediaTalk failed to save due to race condition');
          error.code = 'EBUSY';
          return callback(error);
        }

        _this.docHash = docHash;
        _this.doc = newDoc;
        _this.updateAuthorHash();

        callback(null, newDoc);
      });
    }
  }, {
    key: 'deleteComment',
    value: function deleteComment(author, time, callback) {
      var _this2 = this;

      // prevent racing
      var doc = this.doc;

      // check existence
      var index = doc.comments.find(function (c) {
        return c.author === author && c.time === time;
      });
      if (index === -1) {
        return process.nextTick(function () {
          return callback(doc);
        });
      }

      var newDoc = {
        owner: doc.owner,
        digest: doc.digest,
        comments: [].concat((0, _toConsumableArray3.default)(doc.comments.slice(0, index)), (0, _toConsumableArray3.default)(doc.comments.slice(index + 1)))
      };

      (0, _freeze2.default)(newDoc);

      this.save(newDoc, function (err, docHash) {

        if (err) return callback(err);
        if (doc !== _this2.doc) {
          var error = new Error('mediaTalk failed to save due to race condition');
          error.code = 'EBUSY';
          return callback(error);
        }

        _this2.docHash = docHash;
        _this2.doc = newDoc;
        _this2.updateAuthorHash();

        callback(null, newDoc);
      });
    }

    // generate a new Map from scratch

  }, {
    key: 'updateAuthorHash',
    value: function updateAuthorHash() {

      var authorHash = new _map2.default();
      var comments = this.doc.comments;

      // create a new set
      var authorSet = new _set2.default();
      // put all authors into set
      comments.forEach(function (cmt) {
        return authorSet.add(cmt.author);
      });

      if (authorSet.size) {
        // construct author array from set
        var authors = (0, _from2.default)(authorSet).sort();
        // for each author, store author => hash in map
        authors.forEach(function (author) {
          return authorHashMap.set(author, hashObject(comments.filter(function (cmt) {
            return cmt.author === author;
          })));
        });
      }

      this.authorHash = authorHash;
    }
  }, {
    key: 'authorsDigest',
    value: function authorsDigest(authors) {
      var _this3 = this;

      var filtered = authors.filter(function (author) {
        return _this3.authorHashMap.has(author);
      });
      if (!filtered.length) return null;

      var buffers = filtered.map(function (author) {
        return Buffer.from(_this3.authorHashMap.get(author), 'hex');
      });
      for (var i = 0; i < 32; i++) {
        for (var j = 1; j < buffers.length; j++) {
          buffers[0][i] ^= buffers[j][i];
        }
      }return buffers[0].toString('hex');
    }
  }, {
    key: 'authorsTalk',
    value: function authorsTalk(authors) {
      var _this4 = this;

      var filtered = authors.filter(function (author) {
        return _this4.authorHashMap.has(author);
      });

      return {
        owner: this.owner,
        digest: this.digest,
        comments: this.comments.filter(function (cmt) {
          return filtered.find(cmt.author);
        }).sort(function (a, b) {
          return a.time - b.time;
        })
      };
    }
  }, {
    key: 'getTalk',
    value: function getTalk() {

      return {
        owner: this.owner,
        digest: this.digest,
        comments: this.comments.sort(function (a, b) {
          return a.time - b.time;
        })
      };
    }
  }]);
  return MediaTalkPrototype;
}();

// this function create a blank talk, which has not been saved before, then 
// there is neither document hash nor comments


var createMediaTalk = function createMediaTalk(prototype, owner, digest) {
  return (0, _create2.default)(prototype, {
    owner: owner, digest: digest, comments: [], authorHash: new _map2.default()
  });
};

var createMediaTalkFromDoc = function createMediaTalkFromDoc(prototype, obj, hash) {
  return (0, _create2.default)(prototype, obj).updateAuthorHash();
};

exports.createMediaTalk = createMediaTalk;
exports.createMediaTalkFromDoc = createMediaTalkFromDoc;