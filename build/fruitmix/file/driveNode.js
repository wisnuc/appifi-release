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

var _directoryNode = require('./directoryNode');

var _directoryNode2 = _interopRequireDefault(_directoryNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DriveNode = function (_DirectoryNode) {
  (0, _inherits3.default)(DriveNode, _DirectoryNode);

  function DriveNode(ctx, xstat, drive) {
    (0, _classCallCheck3.default)(this, DriveNode);

    var _this = (0, _possibleConstructorReturn3.default)(this, (DriveNode.__proto__ || (0, _getPrototypeOf2.default)(DriveNode)).call(this, ctx, xstat));

    _this.drive = drive;
    return _this;
  }

  (0, _createClass3.default)(DriveNode, [{
    key: 'updateDrive',
    value: function updateDrive(drive) {
      this.drive = drive;
    }
  }]);
  return DriveNode;
}(_directoryNode2.default);

exports.default = DriveNode;