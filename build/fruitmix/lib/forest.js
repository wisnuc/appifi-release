'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _node = require('./node');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// observable
var Forest = function (_EventEmitter) {
  (0, _inherits3.default)(Forest, _EventEmitter);

  function Forest() {
    (0, _classCallCheck3.default)(this, Forest);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Forest.__proto__ || (0, _getPrototypeOf2.default)(Forest)).call(this));

    _this.roots = [];
    _this.uuidMap = new _map2.default();
    _this.nodeListeners = [];
    return _this;
  }

  (0, _createClass3.default)(Forest, [{
    key: 'registerNodeListener',
    value: function registerNodeListener(listener) {
      this.nodeListeners.push(listener);
    }

    // 1. return a node if success, or undefined / null if failed

  }, {
    key: 'addNode',
    value: function addNode(parent, props) {

      if (parent !== null) throw new Error('not implemented yet');
      var node = (0, _node.createNode)(props);
      if (!node) return;
      this.roots.push(node);
      this.uuidMap.set(node.uuid, node);
      this.nodeListeners.forEach(function (l) {
        return l.nodeAdded && l.nodeAdded(node);
      });
    }
  }, {
    key: 'updateHashMagic',
    value: function updateHashMagic(node, hash, magic) {
      var newProps = (0, _assign2.default)({}, node.props, { hash: hash, magic: magic });
      this.updateProps(node, newProps);
    }
  }, {
    key: 'updateProps',
    value: function updateProps(node, newProps) {
      var oldProps = node.props;
      node.props = newProps;
      this.nodeListeners.forEach(function (l) {
        return l.nodePropsUpdated && l.nodePropsUpdated(oldProps, newProps);
      });
    }
  }]);
  return Forest;
}(_events2.default);

// key: digest (sha256), 
// value: container, media type, in-file metadata, digest
// nodes[] file/forest module reference


var Digester = function () {
  function Digester(forest) {
    (0, _classCallCheck3.default)(this, Digester);

    this.map = new _map2.default();
    this.forest = forest;
    forest.registerNodeListener(this);
  }

  (0, _createClass3.default)(Digester, [{
    key: 'nodeAdded',
    value: function nodeAdded(node) {
      console.log('node with uuid ' + node.uuid + ' added');

      if (node.type === 'file' && node.hash && node.magic.startsWith('JPEG')) {

        var container = this.map.get(node.hash);
        if (container) {
          container.nodes.push(node);
        } else {
          container = {
            digest: node.hash,
            type: 'JPEG',
            metadata: null,
            nodes: [node]
          };

          this.map.set(node.hash, container);
        }
      }
    }
  }, {
    key: 'nodeHashMagicUpdate',
    value: function nodeHashMagicUpdate() {}
  }]);
  return Digester;
}();