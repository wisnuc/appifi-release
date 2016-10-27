'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _sysconfig = require('./sysconfig');

var _sysconfig2 = _interopRequireDefault(_sysconfig);

var _barcelona = require('./barcelona');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

console.log('barcelona imported');

exports.default = function () {
  (0, _barcelona.updateFanSpeed)();
  (0, _barcelona.pollingPowerButton)();
  (0, _barcelona.setFanScale)(_sysconfig2.default.get('barcelonaFanScale'));
};