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

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Transform = _stream2.default.Transform;

var HashTransform = function (_Transform) {
  (0, _inherits3.default)(HashTransform, _Transform);

  function HashTransform() {
    (0, _classCallCheck3.default)(this, HashTransform);

    var _this = (0, _possibleConstructorReturn3.default)(this, (HashTransform.__proto__ || (0, _getPrototypeOf2.default)(HashTransform)).call(this));

    _this.hashStream = _crypto2.default.createHash('sha256');
    _this.hashStream.setEncoding('hex');
    return _this;
  }

  (0, _createClass3.default)(HashTransform, [{
    key: '_transform',
    value: function _transform(buf, enc, next) {
      console.log(buf);
      this.hashStream.update(buf);
      this.push(buf);
      next();
    }
  }, {
    key: 'getHash',
    value: function getHash() {
      return this.hashStream.read();
    }
  }]);
  return HashTransform;
}(Transform);

exports.default = function () {
  return new HashTransform();
};