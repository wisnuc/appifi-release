'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _defineProperty2 = require('babel-runtime/helpers/defineProperty');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = function argv(key) {
  return process.argv.find(function (item, index, array) {
    return array[index - 1] === '--' + key;
  });
};

var config = ['path'].reduce(function (acc, c) {
  return (0, _assign2.default)(acc, (0, _defineProperty3.default)({}, c, argv(c)));
}, {});

exports.default = config;