'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IndexedTree = exports.nodeProperties = undefined;

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _magicMeta = require('./magicMeta');

var _magicMeta2 = _interopRequireDefault(_magicMeta);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// These are tree node operations
var nodeProperties = {
  root: function root() {
    var node = this;
    while (node.parent !== null) {
      node = node.parent;
    }return node;
  },
  nea: function nea() {
    var node = this;
    while (!node.writelist) {
      node = node.parent;
    }return node;
  },
  isRootOwner: function isRootOwner(userUUID) {
    return this.root().owner.indexOf(userUUID) !== -1;
  },
  userWritable: function userWritable(userUUID) {
    return this.root().owner.indexOf(userUUID) !== -1 || this.nea().writelist.indexOf(userUUID) !== -1;
  },
  userReadable: function userReadable(userUUID) {
    return this.root().owner.indexOf(userUUID) !== -1 || this.nea().writelist.indexOf(userUUID) !== -1 || this.nea().readlist.indexOf(userUUID) !== -1;
  },
  setChild: function setChild(child) {
    this.children ? this.children.push(child) : this.children = [child];
  },
  unsetChild: function unsetChild(child) {
    var children = this.children;
    if (children === undefined) throw new Error('Node has no children');
    var index = children.findIndex(function (c) {
      return c === child;
    });
    if (index === -1) throw new Error('Node has no such child');
    children.splice(index, 1);
    if (children.length === 0) delete this.children;
  },
  getChildren: function getChildren() {
    return this.children ? this.children : [];
  },
  attach: function attach(parent) {
    if (this.parent) throw new Error('node is already attached');
    this.parent = parent;
    parent.setChild(this);
  },
  detach: function detach() {
    if (this.parent === null) throw new Error('Node is already detached');
    this.parent.unsetChild(this);
    this.parent = null;
  },
  upEach: function upEach(func) {
    var node = this;
    while (node !== null) {
      func(node);
      node = node.parent;
    }
  },
  upFind: function upFind(func) {
    var node = this;
    while (node !== null) {
      if (func(node)) return node;
      node = node.parent;
    }
  },
  nodepath: function nodepath() {
    var q = [];
    this.upEach(function (node) {
      return q.unshift(node);
    });
    return q;
  },
  namepath: function namepath() {
    return _path2.default.join.apply(_path2.default, (0, _toConsumableArray3.default)(this.nodepath().map(function (n) {
      return n.name;
    })));
  },
  preVisit: function preVisit(func) {
    func(this);
    if (this.children) this.children.forEach(function (child) {
      return child.preVisit(func);
    });
  },
  postVisit: function postVisit(func) {
    if (this.children) this.children.forEach(function (child) {
      return child.postVisit(func);
    });
    func(this);
  },
  preVisitEol: function preVisitEol(func) {
    if (func(this) && this.children) this.children.forEach(function (child) {
      return child.preVisitEol(func);
    });
  },
  preVisitFind: function preVisitFind(func) {
    if (func(this)) return this;
    if (this.children === undefined) return undefined;
    return this.children.find(function (child) {
      return child.preVisitFind(func);
    });
  },
  isFile: function isFile() {
    return this.type === 'file';
  },
  isDirectory: function isDirectory() {
    return this.type === 'folder';
  }
};

// to prevent unexpected modification
(0, _freeze2.default)(nodeProperties);

var IndexedTree = function (_EventEmitter) {
  (0, _inherits3.default)(IndexedTree, _EventEmitter);


  // proto can be any plain JavaScript object
  // root should have at least the uuid for this general data structure
  // for fruitmix specific usage, root should have owner, writelist and readlist

  function IndexedTree(proto) {
    (0, _classCallCheck3.default)(this, IndexedTree);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(IndexedTree).call(this));

    _this.proto = (0, _assign2.default)(proto, nodeProperties);

    // for accessing node by UUID
    _this.uuidMap = new _map2.default();
    // file only, examine magic and conditionally put node into map
    _this.hashMap = new _map2.default();
    // file only, for file without hashmagic
    _this.hashless = new _set2.default();
    // for digestObj with extended meta but not sure if it has been extracted before
    _this.extended = new _set2.default();
    // folder only, for folder with writer/reader other than drive owner
    _this.shared = new _set2.default();

    _this.roots = [];
    return _this;
  }

  // parent, children
  // uuid, type
  // owner, writelist, readlist
  // mtime, size
  // hash

  // using whitelist for props, aka, builder pattern, this will
  // ease the indexing maintenance when updating props


  (0, _createClass3.default)(IndexedTree, [{
    key: 'createNode',
    value: function createNode(parent, props) {

      // create empty object
      var node = (0, _create2.default)(this.proto);

      // set uuid
      if (!props.uuid) throw new Error('props must have uuid property');
      node.uuid = props.uuid;

      // set type
      if (!props.type) throw new Error('props must have type property');
      if (props.type !== 'file' && props.type !== 'folder') throw new Error('type must be file or folder');
      if (parent === null && props.type !== 'folder') throw new Error('root object type must be folder');
      node.type = props.type;

      // set name
      if (!props.name || typeof props.name !== 'string' || !props.name.length) throw new Error('name must be non-empty string');
      node.name = props.name;

      // set owner if different from proto
      if (!props.owner || !Array.isArray(props.owner)) throw new Error('owner must be an array');
      if (parent === null && !props.owner.length) throw new Error('root owner cannot be empty');

      node.owner = props.owner;

      if (parent === null) {
        if (!props.writelist || !Array.isArray(props.writelist)) throw new Error('root writelist must be an array');
        if (!props.readlist || !Array.isArray(props.readlist)) throw new Error('root readlist must be an array');
      } else {
        if (props.writelist && !Array.isArray(props.writelist)) throw new Error('writelist must be an array if defined');
        if (props.readlist && !Array.isArray(props.readlist)) throw new Error('readlist must be an array if defined');

        if (!!props.writelist !== !!props.readlist) throw new Error('writelist and readlist must be either defined or undefined together');
      }

      // set writelist and readlist if any
      if (props.writelist) {
        node.writelist = props.writelist;
        node.readlist = props.readlist;
      }

      // size and mtime
      if (node.isFile()) {
        node.size = props.size;
        node.mtime = props.mtime;
      }

      // set structural relationship
      if (parent === null) {
        node.parent = null; // TODO: should have a test case for this !!! this may crash forEach
      } else {
        node.attach(parent);
      }

      // set uuid indexing
      this.uuidMap.set(node.uuid, node);

      // set digest indexing for file, or shared for folder
      if (node.isFile()) {
        this.fileHashInstall(node, props.hash, props.magic);
      } else if (node.isDirectory()) {
        if (node.writelist) this.shared.add(node);
      }

      if (parent === null) this.roots.push(node);
      return node;
    }
  }, {
    key: 'fileHashInstall',
    value: function fileHashInstall(node, hash, magic) {

      if (!hash) {
        this.hashless.add(node);

        // TODO
        // this is probably not the best place to emit since the content update is not finished yet.
        this.emit('hashlessAdded', node);
        return;
      }

      var digestObj = this.hashMap.get(hash);
      if (digestObj) {
        digestObj.nodes.push(node);
        return;
      }

      var meta = (0, _magicMeta2.default)(magic);
      if (meta) {
        node.hash = hash;
        digestObj = {
          meta: meta,
          nodes: [node]
        };
        this.hashMap.set(hash, digestObj);
        if (meta.extended) {
          this.extended.add(digestObj);
          this.emit('extendedAdded', digestObj);
        }
      }
    }
  }, {
    key: 'fileHashUninstall',
    value: function fileHashUninstall(node) {

      // if no hash
      if (!node.hash) {
        if (this.hashless.has(node)) {
          this.hashless.delete(node);
        }
        return;
      }

      // let hash = node.hash // TODO

      // retrieve digest object
      var digestObj = this.hashMap.get(node.hash);
      if (!digestObj) throw new Error('hash (' + node.hash + ') not found in hashmap)');

      // find in node array
      var index = digestObj.nodes.find(function (x) {
        return x === node;
      });
      if (index === -1) throw new Error('hash (' + node.hash + ') not found in digest object node array');

      // remove and delete hash property
      digestObj.nodes.splice(index, 1);
      delete node.hash;

      // destory digest object if this is last one
      if (digestObj.nodes.length === 0) {
        // try to remove it out of extended (probably already removed)
        if (digestObj.meta.extended) this.extended.delete(digestObj);
        this.hashMap.delete(node.hash);
      }
    }

    // actually all operation should update file/folder on disk first,
    // then readback xstat, so this is the only method to update node

  }, {
    key: 'updateNode',
    value: function updateNode(node, props) {

      if (props.uuid !== node.uuid || props.type !== node.type) return false;

      if (node.isDirectory()) {

        node.owner = props.owner;
        node.writelist = props.writelist;
        node.readlist = props.readlist;
        node.name = props.name;

        if (node.writelist) this.shared.add(node);else this.shared.delete(node);
      } else if (node.isFile()) {

        this.fileHashUninstall(node);

        node.owner = props.owner;
        node.writelist = props.writelist;
        node.readlist = props.readlist;
        node.name = props.name;
        node.mtime = props.mtime;
        node.size = props.size;

        this.fileHashInstall(node, props.hash, props.magic);
      } else {
        // throw an error?
      }

      return true;
    }

    // this function delete one leaf node
    // for delete a sub tree, using higher level method

  }, {
    key: 'deleteNode',
    value: function deleteNode(node) {

      if (node.children) throw new Error('node has children, cannot be deleted');

      if (node.isFile()) {
        this.fileHashUninstall(node);
      } else if (node.isDirectory()) {
        this.shared.delete(node); // ignore true or false
      }

      this.uuidMap.delete(node.uuid);
      if (node === this.root) {
        this.root = null;
      } else {
        node.detach();
      }
    }
  }, {
    key: 'deleteNodeByUUID',
    value: function deleteNodeByUUID(uuid) {
      var node = this.uuidMap.get(uuid);
      if (!node) return null;
      this.deleteNode(node);
    }
  }, {
    key: 'deleteSubTree',
    value: function deleteSubTree(node) {
      var _this2 = this;

      node.postVisit(function (n) {
        return _this2.deleteNode(n);
      });
    }
  }, {
    key: 'findNodeByUUID',
    value: function findNodeByUUID(uuid) {
      return this.uuidMap.get(uuid);
    }
  }]);
  return IndexedTree;
}(_events2.default);

exports.nodeProperties = nodeProperties;
exports.IndexedTree = IndexedTree;