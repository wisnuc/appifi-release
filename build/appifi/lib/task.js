'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _events2 = require('events');

var _events3 = _interopRequireDefault(_events2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var task = function (_events) {
  (0, _inherits3.default)(task, _events);

  function task(type, id, parent) {
    (0, _classCallCheck3.default)(this, task);

    var _this = (0, _possibleConstructorReturn3.default)(this, (task.__proto__ || (0, _getPrototypeOf2.default)(task)).call(this));

    _this.parent = parent;
    _this.type = type;
    _this.id = id;
    _this.status = 'started';
    _this.errno = 0;
    _this.message = null;

    /** must implement getState() **/
    return _this;
  }

  (0, _createClass3.default)(task, [{
    key: 'getState',
    value: function getState() {
      return {};
    }

    // brilliant name

  }, {
    key: 'facade',
    value: function facade() {
      return (0, _assign2.default)({
        type: this.type,
        id: this.id,
        status: this.status,
        errno: this.errno,
        message: this.message
      }, this.getState());
    }
  }]);
  return task;
}(_events3.default);

exports.default = task;