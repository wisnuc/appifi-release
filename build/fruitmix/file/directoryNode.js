'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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

var _get2 = require('babel-runtime/helpers/get');

var _get3 = _interopRequireDefault(_get2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _probe2 = require('./probe');

var _probe3 = _interopRequireDefault(_probe2);

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

var _fileNode = require('./fileNode');

var _fileNode2 = _interopRequireDefault(_fileNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DirectoryNode = function (_Node) {
  (0, _inherits3.default)(DirectoryNode, _Node);

  function DirectoryNode(ctx, xstat) {
    (0, _classCallCheck3.default)(this, DirectoryNode);

    var _this = (0, _possibleConstructorReturn3.default)(this, (DirectoryNode.__proto__ || (0, _getPrototypeOf2.default)(DirectoryNode)).call(this, ctx));

    _this.uuid = xstat.uuid;
    _this.name = xstat.name;
    _this.mtime = -xstat.mtime;
    return _this;
  }

  (0, _createClass3.default)(DirectoryNode, [{
    key: 'merge',
    value: function merge(mtime, xstats) {
      var _this2 = this;

      var map = new _map2.default(xstats.map(function (x) {
        return [x.uuid, x];
      }));
      var children = this.getChildren();

      var lost = [];
      children.forEach(function (c) {
        var xstat = map.get(c.uuid);
        if (!xstat) return lost.push(c);
        c.update(xstat);
        map.delete(c.uuid);
      });

      lost.forEach(function (l) {
        return l.detach();
      });

      // found
      map.forEach(function (xstat) {

        var node = xstat.type === 'directory' ? new DirectoryNode(_this2.ctx, xstat) : xstat.type === 'file' ? new _fileNode2.default(_this2.ctx, xstat) : undefined;

        node && node.attach(_this2);
      });

      this.mtime = mtime;
    }
  }, {
    key: 'probe',
    value: function probe() {
      var _this3 = this;

      if (this.worker) return this.worker.request();

      var dpath = this.abspath();
      var uuid = this.uuid;
      var mtime = this.mtime;
      var delay = mtime < 0 ? 0 : 500;

      this.ctx.probeStarted(this); // audit
      this.worker = (0, _probe3.default)(dpath, uuid, mtime, delay);

      // 
      this.worker.on('error', function (err, again) {

        _this3.worker = null;
        _this3.ctx.probeStopped(_this3); // audit

        if (err.code === 'EABORT') return;

        // if parent`s exist 
        _this3.parent ? _this3.parent.probe() : _this3.probe();
        return;
      });

      this.worker.on('finish', function (data, again) {

        _this3.worker = null;
        _this3.ctx.probeStopped(_this3); // audit

        if (data) _this3.merge(data.mtime, data.xstats);
        if (again) _this3.probe();
      });

      this.worker.start();
    }
  }, {
    key: 'attach',
    value: function attach(parent) {
      (0, _get3.default)(DirectoryNode.prototype.__proto__ || (0, _getPrototypeOf2.default)(DirectoryNode.prototype), 'attach', this).call(this, parent);
      this.probe();
    }
  }, {
    key: 'update',
    value: function update(xstat) {
      this.name = xstat.name;
      if (this.mtime !== xstat.mtime) this.probe();
    }
  }, {
    key: 'detach',
    value: function detach() {
      [].concat((0, _toConsumableArray3.default)(this.getChildren())).forEach(function (c) {
        return c.detach();
      });
      this.abort();
      (0, _get3.default)(DirectoryNode.prototype.__proto__ || (0, _getPrototypeOf2.default)(DirectoryNode.prototype), 'detach', this).call(this);
    }
  }, {
    key: 'isDirectory',
    value: function isDirectory() {
      return true;
    }
  }]);
  return DirectoryNode;
}(_node2.default); // import { FILE } from '../lib/const'


exports.default = DirectoryNode;