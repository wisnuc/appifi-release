'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:model');

/** simply using a JavaScript plain object as key value pairs for singleton models **/

var models = {};

var setModel = function setModel(name, model) {
  debug('set model ' + name);
  models[name] = model;
};

var getModel = function getModel(name) {
  if (models[name] === undefined) throw new Error('model ' + name + ' not found');
  return models[name];
};

var list = function list() {
  return (0, _assign2.default)({}, models);
};

var clear = function clear() {
  return models = {};
};

exports.default = { setModel: setModel, getModel: getModel, list: list, clear: clear };