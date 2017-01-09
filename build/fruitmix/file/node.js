'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNode = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// tree, link-list => recursive
// array, => linear
// for (let x= node; x.parent !== null; x = x.parent)
// 
// turing machine vs lambda calculus / functional programming
// lambda expression () => {}
//

var Node = function () {
  function Node(props) {
    (0, _classCallCheck3.default)(this, Node);

    // TODO
    (0, _assign2.default)(this, props);
    this.parent = null;
    this.children = []; // new Set
  }

  (0, _createClass3.default)(Node, [{
    key: 'attach',
    value: function attach(parent) {
      if (this.parent) throw new Error('node is already attached');
      this.parent = parent;
      parent.setChild(this);
    }
  }, {
    key: 'detach',
    value: function detach() {
      if (this.parent === null) throw new Error('Node is already detached');
      this.parent.unsetChild(this);
      this.parent = null;
    }
  }, {
    key: 'setChild',
    value: function setChild(child) {
      this.children ? this.children.push(child) : this.children = [child];
    }
  }, {
    key: 'unsetChild',
    value: function unsetChild(child) {

      var children = this.children;
      if (children === undefined) throw new Error('Node has no children');

      var index = children.findIndex(function (c) {
        return c === child;
      });
      if (index === -1) throw new Error('Node has no such child');
      children.splice(index, 1);

      if (children.length === 0) delete this.children;
    }
  }, {
    key: 'root',
    value: function root() {
      var node = this;
      while (node.parent !== null) {
        node = node.parent;
      }return node;
    }
  }, {
    key: 'nea',
    value: function nea() {
      var node = this;
      while (!node.writelist) {
        node = node.parent;
      }return node;
    }
  }, {
    key: 'isRootOwner',
    value: function isRootOwner(userUUID) {
      return this.root().owner.indexOf(userUUID) !== -1;
    }
  }, {
    key: 'userWritable',
    value: function userWritable(userUUID) {
      return this.root().owner.indexOf(userUUID) !== -1 || this.nea().writelist.indexOf(userUUID) !== -1;
    }
  }, {
    key: 'userReadable',
    value: function userReadable(userUUID) {
      return this.root().owner.indexOf(userUUID) !== -1 || this.nea().writelist.indexOf(userUUID) !== -1 || this.nea().readlist.indexOf(userUUID) !== -1;
    }

    // always return array

  }, {
    key: 'getChildren',
    value: function getChildren() {
      return this.children ? this.children : [];
    }
  }, {
    key: 'upEach',
    value: function upEach(func) {
      var node = this;
      while (node !== null) {
        func(node);
        node = node.parent;
      }
    }
  }, {
    key: 'upFind',
    value: function upFind(func) {
      var node = this;
      while (node !== null) {
        if (func(node)) return node;
        node = node.parent;
      }
    }
  }, {
    key: 'nodepath',
    value: function nodepath() {
      var q = [];
      this.upEach(function (node) {
        return q.unshift(node);
      });
      return q;
    }
  }, {
    key: 'namepath',
    value: function namepath() {
      var _path;

      return (_path = path).join.apply(_path, (0, _toConsumableArray3.default)(this.nodepath().map(function (n) {
        return n.name;
      })));
    }
  }, {
    key: 'walkDown',
    value: function walkDown(names) {
      if (names.length === 0) return this;
      var named = this.getChildren().find(function (child) {
        return child.name === names[0];
      });
      if (!named) return this;
      return named.walkDown(names.slice(1));
    }
  }, {
    key: 'preVisit',
    value: function preVisit(func) {
      func(this);
      if (this.children) this.children.forEach(function (child) {
        return child.preVisit(func);
      });
    }
  }, {
    key: 'postVisit',
    value: function postVisit(func) {
      if (this.children) this.children.forEach(function (child) {
        return child.postVisit(func);
      });
      func(this);
    }
  }, {
    key: 'preVisitEol',
    value: function preVisitEol(func) {
      if (func(this) && this.children) this.children.forEach(function (child) {
        return child.preVisitEol(func);
      });
    }
  }, {
    key: 'preVisitFind',
    value: function preVisitFind(func) {
      if (func(this)) return this;
      if (this.getChildren().length === 0) return undefined;
      return this.children.find(function (child) {
        return child.preVisitFind(func);
      });
    }
  }, {
    key: 'isFile',
    value: function isFile() {
      return this.type === 'file';
    }
  }, {
    key: 'isDirectory',
    value: function isDirectory() {
      return this.type === 'folder';
    }
  }]);
  return Node;
}();

var FileNode = function (_Node) {
  (0, _inherits3.default)(FileNode, _Node);

  function FileNode(props) {
    (0, _classCallCheck3.default)(this, FileNode);
    return (0, _possibleConstructorReturn3.default)(this, (FileNode.__proto__ || (0, _getPrototypeOf2.default)(FileNode)).call(this, props));
  }

  return FileNode;
}(Node);

var FolderNode = function (_Node2) {
  (0, _inherits3.default)(FolderNode, _Node2);

  function FolderNode(props) {
    (0, _classCallCheck3.default)(this, FolderNode);
    return (0, _possibleConstructorReturn3.default)(this, (FolderNode.__proto__ || (0, _getPrototypeOf2.default)(FolderNode)).call(this, props));
  }

  return FolderNode;
}(Node);

// node.type ==== 'file'


node instanceof FileNode;

var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' && _validator2.default.isUUID(uuid);
};

// throw error
var createNode = function createNode(props) {

  // props must have uuid
  if (!isUUID(props.uuid)) {
    var e = new Error('invalid uuid');
    e.code = 'EINVAL';
    throw e;
  }

  // props must have type, 'file' or 'folder'
  if (props.type !== 'file' && props.type !== 'folder') {
    var _e = new Error('invalid type');
    _e.code = 'EINVAL';
    throw _e;
  }

  // TODO validate owner, writelist, readlist, name
  // if file, size & mtime 
  // if folder ???? TODO
  return new Node(props);
};

var createFileNode = function createFileNode() {};
var createFolderNode = function createFolderNode() {};

exports.createNode = createNode;