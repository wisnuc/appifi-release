'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.updateFileShareDoc = exports.createFileShareDoc = exports.validateFileShareDoc = undefined;

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _types = require('../lib/types');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * a fileshare doc
 *
 * {
 *   doctype: 'fileshare',        // string, fixed
 *   docversion: '1.0',           // string, fixed
 *   
 *   uuid: xxxx,                  // STRING_UUID 
 *   
 *   author: xxxx,                // STRING_UUID 
 *   writelist: [], // 0..n       // ARRAY_STRING_UUID
 *   readlist: [], // 0..n        // ARRAY_STRING_UUID
 *
 *   ctime: xxxx,                 // INT_TIME
 *   mtime: xxxx,                 // INT_TIME
 *   
 *   collection: [], // 1..n      // ARRAY_STRING_UUID
 * }
 */
var unique = function unique(arr) {
  return new _set2.default(arr).size === arr.length;
};

var isUUIDArray = function isUUIDArray(arg) {
  return Array.isArray(arg) && arg.every(_types.isUUID);
};

var validateFileShareDoc = function validateFileShareDoc(doc, users) {
  var localUsers = users.filter(function (u) {
    return u.type === 'local';
  });
  var members = [doc.author].concat((0, _toConsumableArray3.default)(doc.writelist), (0, _toConsumableArray3.default)(doc.readlist));
  // structure
  (0, _types.validateProps)(doc, ['doctype', 'docversion', 'uuid', 'author', 'writelist', 'readlist', 'ctime', 'mtime', 'collection']);
  // data type
  (0, _types.assert)(doc.doctype === 'fileshare', 'invalid doctype');
  (0, _types.assert)(doc.docversion === '1.0', 'invalid docversion');
  (0, _types.assert)((0, _types.isUUID)(doc.uuid), 'invalid doc uuid');
  (0, _types.assert)((0, _types.isUUID)(doc.author), 'invalid author uuid');

  // if author is not local user, the share is considered invalid
  (0, _types.assert)(localUsers.map(function (u) {
    return u.uuid;
  }).includes(doc.author), 'author not found in local users');

  // writer or reader must be local user
  (0, _types.assert)(isUUIDArray(doc.writelist), 'writelist not uuid array');
  (0, _types.assert)(doc.writelist.every(function (uuid) {
    return localUsers.map(function (u) {
      return u.uuid;
    }).includes(uuid);
  }), 'writelist contains non-local users'); // TODO if local user is deleted ?
  (0, _types.assert)(isUUIDArray(doc.readlist), 'readlist not uuid array');
  (0, _types.assert)(doc.readlist.every(function (uuid) {
    return localUsers.map(function (u) {
      return u.uuid;
    }).includes(uuid);
  }), 'readlist contains non-local users'); // TODO if local user is deleted ?

  // no member in list twice
  (0, _types.assert)(unique(members), 'members not unique');

  (0, _types.assert)((0, _isInteger2.default)(doc.ctime), 'invalid ctime');
  (0, _types.assert)((0, _isInteger2.default)(doc.mtime), 'invalid mtime');

  (0, _types.assert)(isUUIDArray(doc.collection), 'collection not uuid array');
};

var createFileShareDoc = function createFileShareDoc(fileData, authorUUID, obj) {
  var writelist = obj.writelist,
      readlist = obj.readlist,
      collection = obj.collection;


  writelist = (0, _from2.default)(new _set2.default(writelist)).filter(function (writer) {
    return writer !== authorUUID;
  });

  readlist = (0, _from2.default)(new _set2.default(readlist)).filter(function (reader) {
    return reader !== authorUUID;
  });
  readlist = (0, _types.complement)(readlist, writelist);

  collection = (0, _from2.default)(new _set2.default(collection));
  // remove the uuid whose ancestor uuid is already in collection
  var lookup = function lookup(node) {
    if (node.parent) return collection.find(function (uuid) {
      return node.parent.uuid === uuid;
    });
  };
  collection = collection.filter(function (uuid) {
    return !fileData.uuidMap.get(uuid).upFind(lookup);
  });

  var time = new Date().getTime();
  return {
    doctype: 'fileshare',
    docversion: '1.0',
    uuid: _nodeUuid2.default.v4(),
    author: authorUUID,
    writelist: writelist,
    readlist: readlist,
    ctime: time,
    mtime: time,
    collection: collection
  };
};

var updateFileShareDoc = function updateFileShareDoc(fileData, doc, ops) {
  var op = void 0;
  var writelist = doc.writelist,
      readlist = doc.readlist,
      collection = doc.collection;


  var lookup = function lookup(node) {
    if (node.parent) return collection.find(function (uuid) {
      return node.parent.uuid === uuid;
    });
  };

  op = ops.find(function (op) {
    return op.path === 'writelist' && op.operation === 'add';
  });
  if (op) {
    writelist = (0, _types.addUUIDArray)(writelist, op.value);
    // delete the reader which is moved to writelist
    readlist = (0, _types.complement)(readlist, op.value);
  }

  op = ops.find(function (op) {
    return op.path === 'writelist' && op.operation === 'delete';
  });
  if (op) writelist = (0, _types.complement)(writelist, op.value);

  op = ops.find(function (op) {
    return op.path === 'readlist' && op.operation === 'add';
  });
  if (op) {
    // && Array.isArray(op.value))
    readlist = (0, _types.addUUIDArray)(readlist, op.value);
    readlist = (0, _types.complement)(readlist, writelist); //dedupe
  }

  op = ops.find(function (op) {
    return op.path === 'readlist' && op.operation === 'delete';
  });
  if (op) readlist = (0, _types.complement)(readlist, op.value);

  op = ops.find(function (op) {
    return op.path === 'collection' && op.operation === 'add';
  });
  if (op) {
    collection = (0, _types.addUUIDArray)(collection, op.value);
    collection = collection.filter(function (uuid) {
      return !fileData.uuidMap.get(uuid).upFind(lookup);
    });
  }

  op = ops.find(function (op) {
    return op.path === 'collection' && op.operation === 'delete';
  });
  if (op) collection = (0, _types.complement)(collection, op.value);

  if (writelist === doc.writelist && readlist === doc.readlist && collection === doc.collection) {
    return doc;
  }

  var update = {
    doctype: doc.doctype,
    docversion: doc.docversion,
    uuid: doc.uuid,
    author: doc.author,
    writelist: writelist,
    readlist: readlist,
    ctime: doc.ctime,
    mtime: new Date().getTime(),
    collection: collection
  };

  return update;
};

exports.validateFileShareDoc = validateFileShareDoc;
exports.createFileShareDoc = createFileShareDoc;
exports.updateFileShareDoc = updateFileShareDoc;