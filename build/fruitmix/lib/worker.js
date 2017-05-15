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

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var E = require('./error');

var Worker = function (_EventEmitter) {
  (0, _inherits3.default)(Worker, _EventEmitter);

  function Worker() {
    (0, _classCallCheck3.default)(this, Worker);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Worker.__proto__ || (0, _getPrototypeOf2.default)(Worker)).call(this));

    _this.finished = false;
    return _this;
  }

  (0, _createClass3.default)(Worker, [{
    key: 'cleanUp',
    value: function cleanUp() {}
  }, {
    key: 'finalize',
    value: function finalize() {
      this.finished = true;
      this.cleanUp();
    }
  }, {
    key: 'error',
    value: function error(e) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.emit.apply(this, ['error', e].concat(args));
      this.finalize();
    }
  }, {
    key: 'finish',
    value: function finish(data) {
      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      this.emit.apply(this, ['finish', data].concat(args));
      this.finalize();
    }
  }, {
    key: 'start',
    value: function start() {
      if (this.finished) throw 'worker already finished';
      this.run();
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.finished) throw 'worker already finished';
      this.emit('error', new E.EABORT());
      this.finalize();
    }
  }]);
  return Worker;
}(_events2.default);

exports.default = Worker;