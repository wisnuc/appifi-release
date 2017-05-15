'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Boot = require('./system/boot');
var Config = require('./system/config');
var Device = require('./system/device');
var Storage = require('./system/storage');

var system = require('./system/index');
var systemServer = require('./system/system');
// const appifi = require('./appifi/appifi')

var configFile = '/etc/wisnuc.json';
var configTmpDir = '/etc/wisnuc/tmp';
var storageFile = '/run/wisnuc/storage';
var storageTmpDir = '/run/wisnuc/tmp';

var main = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.resolve)(Config.initAsync(configFile, configTmpDir));

          case 2:
            _context.next = 4;
            return (0, _bluebird.resolve)(Device.probeAsync());

          case 4:
            _context.next = 6;
            return (0, _bluebird.resolve)(Storage.initAsync(storageFile, storageTmpDir));

          case 6:
            _context.next = 8;
            return (0, _bluebird.resolve)(Boot.autoBootAsync());

          case 8:
            // appifi(system)
            systemServer(system);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function main() {
    return _ref.apply(this, arguments);
  };
}();

main().asCallback(function (err) {
  return err && console.log(err);
});