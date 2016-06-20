'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpStatusError = exports.JSONParserError = exports.HttpResponseError = exports.HttpRequestError = undefined;

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var HttpRequestError = function (_Error) {
  (0, _inherits3.default)(HttpRequestError, _Error);

  function HttpRequestError(e) {
    (0, _classCallCheck3.default)(this, HttpRequestError);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(HttpRequestError).call(this));

    _this.code = e.code;
    return _this;
  }

  return HttpRequestError;
}(Error);

var HttpResponseError = function (_Error2) {
  (0, _inherits3.default)(HttpResponseError, _Error2);

  function HttpResponseError(res) {
    (0, _classCallCheck3.default)(this, HttpResponseError);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(HttpResponseError).call(this));

    _this2.statusCode = res.statusCode;
    _this2.statusMessage = res.statusMessage;
    return _this2;
  }

  return HttpResponseError;
}(Error);

var JSONParserError = function (_Error3) {
  (0, _inherits3.default)(JSONParserError, _Error3);

  function JSONParserError(text) {
    (0, _classCallCheck3.default)(this, JSONParserError);

    var _this3 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(JSONParserError).call(this));

    _this3.text = text;
    return _this3;
  }

  return JSONParserError;
}(Error);

var HttpStatusError = function (_Error4) {
  (0, _inherits3.default)(HttpStatusError, _Error4);

  function HttpStatusError(code) {
    (0, _classCallCheck3.default)(this, HttpStatusError);

    var _this4 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(HttpStatusError).call(this, 'http status code ' + code));

    _this4.code = _this4.errno = 'EHTTPSTATUS';
    _this4.statusCode = code;
    return _this4;
  }

  return HttpStatusError;
}(Error);

exports.HttpRequestError = HttpRequestError;
exports.HttpResponseError = HttpResponseError;
exports.JSONParserError = JSONParserError;
exports.HttpStatusError = HttpStatusError;