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

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events2 = require('events');

var _events3 = _interopRequireDefault(_events2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var advertiser = function (_events) {
  (0, _inherits3.default)(advertiser, _events);

  function advertiser(name, port) {
    (0, _classCallCheck3.default)(this, advertiser);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(advertiser).call(this));

    _this.name = name;
    _this.port = port;
    _this.handle = null;
    return _this;
  }

  (0, _createClass3.default)(advertiser, [{
    key: 'start',
    value: function start() {
      var _this2 = this;

      this.handle = _child_process2.default.spawn('avahi-publish-service', [this.name, '_http._tcp', this.port], { stdio: 'ignore' });

      this.handle.on('exit', function (code, signal) {

        console.log('[advertiser] stop advertising ' + _this2.name + ' @ ' + _this2.port);
        _this2.handle = null;
        _this2.emit('exit', code, signal);
      });

      console.log('[advertiser] start advertising ' + this.name + ' @ ' + this.port);
    }
  }, {
    key: 'isAdvertising',
    value: function isAdvertising() {
      return !!this.handle;
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.handle) {
        this.handle.kill();
      }
    }
  }]);
  return advertiser;
}(_events3.default);

var createAdvertiser = function createAdvertiser(name, port) {
  var adv = new advertiser(name, port);
  adv.start();
  return adv;
};

exports.default = createAdvertiser;