'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateProps = exports.assert = exports.complement = exports.addUUIDArray = exports.isSHA256 = exports.isUUID = undefined;

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' && _validator2.default.isUUID(uuid);
};
var isSHA256 = function isSHA256(hash) {
  return (/[a-f0-9]{64}/.test(hash)
  );
};

var addUUIDArray = function addUUIDArray(a, b) {
  var c = (0, _from2.default)(new _set2.default([].concat((0, _toConsumableArray3.default)(a), (0, _toConsumableArray3.default)(b))));
  return (0, _deepEqual2.default)(a, c) ? a : c;
};

var complement = function complement(a, b) {
  return a.reduce(function (acc, c) {
    return b.includes(c) ? acc : [].concat((0, _toConsumableArray3.default)(acc), [c]);
  }, []);
};

var assert = function assert(predicate, message) {
  if (!predicate) throw new Error(message);
};

var validateProps = function validateProps(obj, mandatory) {
  var optional = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (complement(mandatory, (0, _keys2.default)(obj)).length !== 0) throw new Error('some mandatory props not defined in object');
  if (complement((0, _keys2.default)(obj), [].concat((0, _toConsumableArray3.default)(mandatory), (0, _toConsumableArray3.default)(optional))).length !== 0) throw new Error('object has props that are neither mandatory nor optional');
};

exports.isUUID = isUUID;
exports.isSHA256 = isSHA256;
exports.addUUIDArray = addUUIDArray;
exports.complement = complement;
exports.assert = assert;
exports.validateProps = validateProps;