'use strict';

var _udev = require('udev');

var _udev2 = _interopRequireDefault(_udev);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ports = _udev2.default.list('ata_port');
var blocks = _udev2.default.list('block').filter(function (dev) {
  return !dev.DEVPATH.startsWith('/devices/virtual/');
});
var usbblocks = _udev2.default.list().filter(function (dev) {
  return dev.SUBSYSTEM === 'block' && dev.ID_BUS === 'usb';
});

console.log(ports);
console.log(blocks);