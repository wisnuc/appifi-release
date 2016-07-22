'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setFanScale = exports.pollingPowerButton = exports.updateFanSpeed = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _reducers = require('./reducers');

var _appifiConfig = require('./appifiConfig');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BOARD_EVENT = '/proc/BOARD_event';
var FAN_IO = '/proc/FAN_io';

var fsStatAsync = _bluebird2.default.promisify(_fs2.default.stat);
var fsReadFileAsync = _bluebird2.default.promisify(_fs2.default.readFile);
var childExecAsync = _bluebird2.default.promisify(_child_process2.default.exec);

var updateFanSpeed = function updateFanSpeed() {
  return fsReadFileAsync(FAN_IO).then(function (data) {
    var fanSpeed = parseInt(data.toString().trim());
    (0, _reducers.storeDispatch)({
      type: 'BARCELONA_FANSPEED_UPDATE',
      data: fanSpeed
    });
  }).catch(function (e) {});
}; // suppress nodejs red warning

var powerButtonCounter = 0;

var pollingPowerButton = function pollingPowerButton() {
  return setInterval(function () {
    return fsReadFileAsync(BOARD_EVENT).then(function (data) {
      if (data.toString().trim() === 'PWR ON') {
        powerButtonCounter++;
        if (powerButtonCounter > 4) _child_process2.default.exec('poweroff', function () {});
      } else powerButtonCounter = 0;
    }).catch(function (e) {});
  } // suppress nodejs red warning

  , 1000);
};

var setFanScale = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(scale) {
    var fanScale;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (typeof scale === 'number') {
              _context.next = 2;
              break;
            }

            throw new Error('scale ' + scale + ' is not a number');

          case 2:
            fanScale = Math.floor(scale);

            if (!(fanScale < 0 || fanScale > 100)) {
              _context.next = 5;
              break;
            }

            throw new Error('fanScale ' + fanScale + ' out of range');

          case 5:
            _context.next = 7;
            return childExecAsync('echo ' + fanScale + ' > ' + FAN_IO);

          case 7:

            (0, _appifiConfig.setConfig)('barcelonaFanScale', fanScale);
            (0, _reducers.storeDispatch)({
              type: 'BARCELONA_FANSCALE_UPDATE',
              data: fanScale
            });

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function setFanScale(_x) {
    return _ref.apply(this, arguments);
  };
}();

// workaround
_child_process2.default.exec('echo "PWR_LED 1" > /proc/BOARD_io', function (err) {});

exports.updateFanSpeed = updateFanSpeed;
exports.pollingPowerButton = pollingPowerButton;
exports.setFanScale = setFanScale;