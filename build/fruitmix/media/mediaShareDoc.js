'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateMediaShareDoc = exports.updateMediaShareDoc = exports.createMediaShareDoc = undefined;

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _types = require('../lib/types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**

  This file is media doc factory (no class)

  All format checking goes here. But some times its permissive.
  User permission checking is not included here.

  all functions are synchronous, no i/o operation involved.
  should throw FormatError

  a share doc

  {
M   doctype: 'mediashare',        // string, fixed
M   docversion: '1.0'             // string, fixed

M   uuid: xxxx,                   // STRING_UUID 

M   author: xxxx,                 // STRING_UUID
M   maintainers: [], // 0..n      // ARRAY_STRING_UUID
M   viewers: [], // 0..n          // ARRAY_STRING_UUID

M   album: null or object { title, text } // NULL || OBJECT
M   sticky: true or false,        // bool fixed
    
M   ctime: xxxx,                  // INT_TIME
M   mtime: xxxx,                  // INT_TIME

M   contents: [                   // ARRAY_OBJECT
      {
M       digest: xxxx
M       creator: xxxx
M       ctime: xxxx
      }
    ]
  }
**/

var unique = function unique(arr) {
  return new _set2.default(arr).size === arr.length;
};

var isUUIDArray = function isUUIDArray(arg) {
  return Array.isArray(arg) && arg.every(_types.isUUID);
};

var validateMediaShareDoc = function validateMediaShareDoc(doc, users) {
  var creators = [doc.author].concat((0, _toConsumableArray3.default)(doc.maintainers));
  var members = [doc.author].concat((0, _toConsumableArray3.default)(doc.maintainers), (0, _toConsumableArray3.default)(doc.viewers));

  // structure
  (0, _types.validateProps)(doc, ['doctype', 'docversion', 'uuid', 'author', 'maintainers', 'viewers', 'album', 'sticky', 'ctime', 'mtime', 'contents']);

  // data type
  (0, _types.assert)(doc.doctype === 'mediashare', 'invalid doctype');
  (0, _types.assert)(doc.docversion === '1.0', 'invalid docversion');
  (0, _types.assert)((0, _types.isUUID)(doc.uuid), 'invalid doc uuid'); // TODO unique check?
  (0, _types.assert)((0, _types.isUUID)(doc.author), 'invalid author uuid');

  // if author is neither local nor remote user, the share is considered invalid
  (0, _types.assert)(users.map(function (u) {
    return u.uuid;
  }).includes(doc.author), 'author not found');

  // non-existent maintainer or viewer is possible
  (0, _types.assert)(isUUIDArray(doc.maintainers), 'maintainers not uuid array');
  (0, _types.assert)(isUUIDArray(doc.viewers), 'viewers not uuid array');

  // no member in list twice
  (0, _types.assert)(unique(members), 'members not unique');

  (0, _types.assert)((0, _typeof3.default)(doc.album) === 'object', 'invalid album');
  if (doc.album) {
    (0, _types.validateProps)(doc.album, ['title'], ['text']);
    (0, _types.assert)(typeof doc.album.title === 'string', 'album title not a string');

    if (doc.album.hasOwnProperty('text')) (0, _types.assert)(typeof doc.album.text === 'string', 'album text not a string');
  }

  (0, _types.assert)(doc.sticky === false, 'invalid sticky');

  (0, _types.assert)((0, _isInteger2.default)(doc.ctime), 'invalid ctime');
  (0, _types.assert)((0, _isInteger2.default)(doc.mtime), 'invalid mtime');

  doc.contents.forEach(function (entry) {

    (0, _types.validateProps)(entry, ['digest', 'creator', 'ctime']);

    (0, _types.assert)((0, _types.isSHA256)(entry.digest), 'invalid digest');
    (0, _types.assert)((0, _types.isUUID)(entry.creator), 'invalid creator');
    (0, _types.assert)(creators.includes(entry.creator), 'creator not author or maintainer');
    (0, _types.assert)((0, _isInteger2.default)(entry.ctime), 'invalid ctime');
  });
};

// generate a mediashare doc
var createMediaShareDoc = function createMediaShareDoc(authorUUID, obj) {
  var maintainers = obj.maintainers,
      viewers = obj.viewers,
      album = obj.album,
      contents = obj.contents;


  maintainers = (0, _from2.default)(new _set2.default(maintainers)).filter(function (maintainer) {
    return maintainer !== authorUUID;
  });

  viewers = (0, _from2.default)(new _set2.default(viewers)).filter(function (viewer) {
    return viewer !== authorUUID;
  });
  viewers = (0, _types.complement)(viewers, maintainers);

  var time = new Date().getTime();
  contents = (0, _from2.default)(new _set2.default(contents)).map(function (digest) {
    return {
      creator: authorUUID,
      digest: digest,
      ctime: time
    };
  });

  return {
    doctype: 'mediashare',
    docversion: '1.0',
    uuid: _nodeUuid2.default.v4(),
    author: authorUUID,
    maintainers: maintainers,
    viewers: viewers,
    album: album,
    sticky: false,
    ctime: time,
    mtime: time,
    contents: contents
  };
};

// update a mediashare doc
// each op containes:
// {
//   path: 'maintainers', 'viewers', 'albun', 'sticky', or 'contents', describes which part to be modifed
//   operation: 'add', 'delete', or 'update'. add, delete for array, update for non-array
//   value: the elements to be updated
// }
var updateMediaShareDoc = function updateMediaShareDoc(userUUID, doc, ops) {

  var op = void 0;
  var maintainers = doc.maintainers,
      viewers = doc.viewers,
      album = doc.album,
      contents = doc.contents;


  if (userUUID === doc.author) {

    op = ops.find(function (op) {
      return op.path === 'maintainers' && op.operation === 'add';
    });
    if (op) {
      maintainers = (0, _types.addUUIDArray)(maintainers, op.value);

      // delete the viewer which is moved to maintainers
      viewers = (0, _types.complement)(viewers, op.value);
    }

    op = ops.find(function (op) {
      return op.path === 'maintainers' && op.operation === 'delete';
    });
    if (op) {
      // && Array.isArray(op.value)) {
      maintainers = (0, _types.complement)(maintainers, op.value);

      // the contents shared by deleted maintainers should also be removed
      var deletedUser = (0, _types.complement)(doc.maintainers, maintainers);
      deletedUser.forEach(function (uuid) {
        var index = contents.findIndex(function (item) {
          return item.creator === uuid;
        });
        if (index !== -1) contents.splice(index, 1);
      });
    }

    op = ops.find(function (op) {
      return op.path === 'viewers' && op.operation === 'add';
    });
    if (op) {
      // && Array.isArray(op.value))
      viewers = (0, _types.addUUIDArray)(viewers, op.value);
      viewers = (0, _types.complement)(viewers, maintainers); //dedupe
    }

    op = ops.find(function (op) {
      return op.path === 'viewers' && op.operation === 'delete';
    });
    if (op) // && Array.isArray(op.value))
      viewers = (0, _types.complement)(viewers, op.value);

    op = ops.find(function (op) {
      return op.path === 'album' && op.operation === 'update';
    });
    if (op) {
      // && typeof op.value === 'object'){
      if (op.value === null) album = null;else {
        var title = op.value.title;
        if (op.value.hasOwnProperty('text')) {
          var text = op.value.text;
          album = { title: title, text: text };
        } else album = { title: title };
      }
    }
  }

  if (userUUID === doc.author || doc.maintainers.indexOf(userUUID) !== -1) {

    op = ops.find(function (op) {
      return op.path === 'contents' && op.operation === 'add';
    });
    if (op) {
      var c = [].concat((0, _toConsumableArray3.default)(contents));
      var dirty = false;

      op.value.forEach(function (digest) {
        var index = c.findIndex(function (x) {
          return x.digest === digest;
        });
        if (index !== -1) return;

        dirty = true;
        c.push({
          creator: userUUID,
          digest: digest,
          ctime: new Date().getTime()
        });
      });

      if (dirty) contents = c;
    }

    op = ops.find(function (op) {
      return op.path === 'contents' && op.operation === 'delete';
    });
    if (op) {
      var _c = [].concat((0, _toConsumableArray3.default)(contents));
      var _dirty = false;

      op.value.forEach(function (digest) {
        var index = _c.findIndex(function (x) {
          return x.digest === digest && (userUUID === doc.author || userUUID === x.creator);
        });
        if (index !== -1) {
          _c.splice(index, 1);
          _dirty = true;
        }
      });

      if (_dirty) contents = _c;
    }
  }

  if (maintainers === doc.maintainers && viewers === doc.viewers && album === doc.album && contents === doc.contents) {
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
    sticky: doc.sticky,
    ctime: doc.ctime,
    mtime: new Date().getTime(),
    contents: contents
  };

  return update;
};

exports.createMediaShareDoc = createMediaShareDoc;
exports.updateMediaShareDoc = updateMediaShareDoc;
exports.validateMediaShareDoc = validateMediaShareDoc;