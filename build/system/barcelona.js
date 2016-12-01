'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.barcelonaInit = exports.writeFanScale = exports.readFanSpeed = undefined;

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _async = require('../common/async');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('../reducers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:barcelona');
var BOARD_EVENT = '/proc/BOARD_event';
var FAN_IO = '/proc/FAN_io';

var readFanSpeed = function readFanSpeed(callback) {
  return _async.fs.readFile(FAN_IO, function (err, data) {
    if (err) return callback(err);

    var fanSpeed = parseInt(data.toString().trim());
    if (!(0, _isInteger2.default)(fanSpeed)) return callback(new Error('Parse Failed'));

    callback(null, fanSpeed);
  });
};

var writeFanScale = function writeFanScale(fanScale, callback) {
  return !(0, _isInteger2.default)(fanScale) || fanScale < 0 || fanScale > 100 ? callback(new Error('fanScale must be integer from 0 to 100')) : _async.child.exec('echo ' + fanScale + ' > ' + FAN_IO, function (err) {
    return callback(err);
  });
};

var powerButtonCounter = 0;

var job = function job() {
  return _async.fs.readFile(BOARD_EVENT, function (err, data) {

    if (err) {
      powerButtonCounter = 0;
      debug('board event error', powerButtonCounter);
      return;
    }

    var read = data.toString().trim();
    if (read === 'PWR ON') {
      powerButtonCounter++;
      if (powerButtonCounter > 4) {
        console.log('[barcelona] user long-pressed the power button, shutting down');
        _async.child.exec('poweroff');
      }
    } else {
      powerButtonCounter = 0;
    }

    debug('board event', read, powerButtonCounter);
  });
};

var pollingPowerButton = function pollingPowerButton() {
  return setInterval(job, 1000);
};

var barcelonaInit = function barcelonaInit() {

  console.log('[system] barcelona init');

  _async.child.exec('echo "PWR_LED 1" > /proc/BOARD_io');
  console.log('[barcelona] set power LED to white on');

  pollingPowerButton();
  console.log('[barcelona] start polling power button');

  var fanScale = (0, _reducers.storeState)().config.barcelonaFanScale;
  writeFanScale(fanScale, function (err) {
    if (err) {
      console.log('[barcelona] failed set barcelonaFanScale');
      console.log(err);
    } else {
      console.log('[barcelona] fanScale set to ' + fanScale);
    }
  });
};

exports.readFanSpeed = readFanSpeed;
exports.writeFanScale = writeFanScale;
exports.barcelonaInit = barcelonaInit;