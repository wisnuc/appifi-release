'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Node = function () {
  function Node(ctx) {
    (0, _classCallCheck3.default)(this, Node);


    this.ctx = ctx;
    this.worker = null;
    this.parent = null;
  }

  (0, _createClass3.default)(Node, [{
    key: 'root',
    value: function (_root) {
      function root() {
        return _root.apply(this, arguments);
      }

      root.toString = function () {
        return _root.toString();
      };

      return root;
    }(function () {
      var node = this;
      while (node.parent !== null) {
        node = node.parent;
      }return root;
    })
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
    key: 'getChildren',
    value: function getChildren() {
      return this.children ? this.children : [];
    }
  }, {
    key: 'attach',
    value: function attach(parent) {

      if (this.parent) {
        var e = new Error('node is already attached');
        console.log('>>>>>>>>');
        console.log('this, parent, e', this, parent, e);
        console.log('<<<<<<<<');
        throw e;
      }

      if (!(parent instanceof Node)) {
        var _e = new Error('parent is not a directory node');
        console.log('>>>>>>>>');
        console.log('this, parent, e', this, parent, _e);
        console.log('<<<<<<<<');
        throw _e;
      }

      this.parent = parent;
      if (parent) parent.setChild(this);
      this.ctx.nodeAttached(this);
    }
  }, {
    key: 'detach',
    value: function detach() {

      this.ctx.nodeDetaching(this);
      if (this.parent === null) throw new Error('node is already detached');
      this.parent.unsetChild(this);
      this.parent = null;
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

    // return node array starting from drive node 

  }, {
    key: 'nodepath',
    value: function nodepath() {

      var q = [];
      for (var n = this; n !== null; n = n.parent) {
        if (n === this.ctx.root) return q;
        q.unshift(n);
      }

      throw new _error2.default.ENODEDETACHED();
    }

    // return drive node

  }, {
    key: 'getDrive',
    value: function getDrive() {

      for (var n = this; n !== null; n = n.parent) {
        if (n.parent === this.ctx.root) return n.drive;
      }

      throw new _error2.default.ENODEDETACHED();
    }
  }, {
    key: 'abspath',
    value: function abspath() {

      return _path2.default.join.apply(_path2.default, [this.ctx.dir].concat((0, _toConsumableArray3.default)(this.nodepath().map(function (n) {
        return n.name;
      }))));
    }
  }, {
    key: 'namepath',
    value: function namepath() {

      return _path2.default.join.apply(_path2.default, (0, _toConsumableArray3.default)(this.nodepath().map(function (n) {
        return n.name;
      })));
    }
  }, {
    key: 'walkdown',
    value: function walkdown(names) {}
    // TODO


    // abort workers // TODO nullify worker?

  }, {
    key: 'abort',
    value: function abort() {
      if (this.worker) this.worker.abort();
    }
  }, {
    key: 'isFile',
    value: function isFile() {
      return false;
    }
  }, {
    key: 'isDirectory',
    value: function isDirectory() {
      return false;
    }
  }, {
    key: 'genObject',
    value: function genObject() {
      return this.getChildren().reduce(function (acc, c) {
        acc[c.name] = c.genObject();
        return acc;
      }, {});
    }
  }]);
  return Node;
}();

exports.default = Node;