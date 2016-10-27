'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rimraf = exports.mkdirp = exports.xattr = exports.fs = exports.rimrafAsync = exports.mkdirpAsync = undefined;

var _bluebird = require('bluebird');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _bluebird.promisifyAll)(_fs2.default);
(0, _bluebird.promisifyAll)(_fsXattr2.default);

var mkdirpAsync = exports.mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
var rimrafAsync = exports.rimrafAsync = (0, _bluebird.promisify)(_rimraf2.default);

exports.fs = _fs2.default;
exports.xattr = _fsXattr2.default;
exports.mkdirp = _mkdirp2.default;
exports.rimraf = _rimraf2.default;