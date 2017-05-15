'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _hash = require('./hash');

var _hash2 = _interopRequireDefault(_hash);

var _identify2 = require('./identify');

var _identify3 = _interopRequireDefault(_identify2);

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pretty = require('prettysize');

// import command from '../lib/command'

var FileNode = function (_Node) {
  (0, _inherits3.default)(FileNode, _Node);

  // create file node
  function FileNode(ctx, xstat) {
    (0, _classCallCheck3.default)(this, FileNode);

    var _this = (0, _possibleConstructorReturn3.default)(this, (FileNode.__proto__ || (0, _getPrototypeOf2.default)(FileNode)).call(this, ctx));

    _this.uuid = xstat.uuid;
    _this.name = xstat.name;
    _this.mtime = xstat.mtime;
    _this.size = xstat.size;
    _this.magic = xstat.magic;
    _this.hash = xstat.hash;
    return _this;
  }

  (0, _createClass3.default)(FileNode, [{
    key: 'identify',
    value: function identify() {
      var _this2 = this;

      this.worker = (0, _identify3.default)(this.abspath(), this.uuid, this.hash);
      this.worker.on('error', function (err) {
        _this2.worker = null;
        _this2.ctx.identifyStopped(_this2);
      });

      this.worker.on('finish', function (metadata) {
        _this2.worker = null;
        _this2.ctx.identifyStopped(_this2);
        _this2.ctx.emit('mediaIdentified', _this2, metadata);
      });

      this.worker.start();
      // this.worker = this.createIdentifyWorker(() => {
      //   this.worker = null
      //   if (err) return // TODO:
      //   this.ctx.emit('mediaIdentified', this, metadata)
      // })
    }

    // before update

  }, {
    key: 'updating',
    value: function updating(xstat) {
      this.abort();
      if (this.magic && this.hash) {
        // already appeared
        if (!xstat.magic || xstat.hash !== this.hash) // not media or hash changed
          this.ctx.emit('mediaDisappearing', this);
      }
    }

    // after update

  }, {
    key: 'updated',
    value: function updated() {
      var _this3 = this;

      if (typeof this.magic !== 'string') return;

      if (this.hash && this.magic) this.ctx.emit('mediaAppeared', this);else {
        this.worker = (0, _hash2.default)(this.abspath(), this.uuid);
        this.worker.on('error', function (err) {
          _this3.worker = null;
          _this3.ctx.hashStopped(_this3);
        });

        this.worker.on('finish', function (xstat) {
          _this3.worker = null;
          _this3.ctx.hashStopped(_this3);
          _this3.update(xstat);
        });

        this.worker.start();
      }
    }

    // attach

  }, {
    key: 'attach',
    value: function attach(parent) {
      (0, _get3.default)(FileNode.prototype.__proto__ || (0, _getPrototypeOf2.default)(FileNode.prototype), 'attach', this).call(this, parent);
      this.updated();
    }
  }, {
    key: 'update',
    value: function update(xstat) {

      if (this.name === xstat.name && this.mtime === xstat.mtime && this.size === xstat.size && this.magic === xstat.magic && this.hash === xstat.hash) return;

      this.updating(xstat);

      this.name = xstat.name;
      this.mtime = xstat.mtime;
      this.size = xstat.size;
      this.magic = xstat.magic;
      this.hash = xstat.hash;

      this.updated();
    }
  }, {
    key: 'detach',
    value: function detach() {
      this.abort();
      if (this.magic && this.hash) this.ctx.emit('mediaDisappearing', this);
      (0, _get3.default)(FileNode.prototype.__proto__ || (0, _getPrototypeOf2.default)(FileNode.prototype), 'detach', this).call(this);
    }
  }, {
    key: 'isFile',
    value: function isFile() {
      return true;
    }
  }, {
    key: 'genObject',
    value: function genObject() {
      return pretty(this.size) + ' ' + (this.hash ? this.hash.slice(0, 8) : '');
    }
  }]);
  return FileNode;
}(_node2.default);

exports.default = FileNode;