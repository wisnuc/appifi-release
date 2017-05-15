'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseIdentifyOutput = exports.validateExifDateTime = undefined;

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

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _worker = require('../lib/worker');

var _worker2 = _interopRequireDefault(_worker);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _xstat = require('./xstat');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// always 8 fields, trailing with size in bytes
// !!! don't double quote the string
var identifyFormatString = '%m|%w|%h|%[EXIF:Orientation]|%[EXIF:DateTime]|%[EXIF:Make]|%[EXIF:Model]|%b';

var validateExifDateTime = exports.validateExifDateTime = function validateExifDateTime(str) {

  // "2016:09:19 10:07:05" 
  if (str.length !== 19) return false;

  // "2016-09-19T10:07:05.000Z" this format is defined in ECMAScript specification, as date time string
  var dtstr = str.slice(0, 4) + '-' + str.slice(5, 7) + '-' + str.slice(8, 10) + 'T' + str.slice(11) + '.000Z';
  return !isNaN(Date.parse(dtstr));
};

var parseIdentifyOutput = exports.parseIdentifyOutput = function parseIdentifyOutput(data) {

  var split = data.toString().split('|').map(function (str) {
    return str.trim();
  });
  if (split.length !== 8) return;

  var obj = {};

  // 0: format
  if (split[0] === 'JPEG') obj.format = 'JPEG';else return;

  // 1: width
  var width = parseInt(split[1]);
  if ((0, _isInteger2.default)(width) && width > 0) obj.width = width;else return;

  // 2: height
  var height = parseInt(split[2]);
  if ((0, _isInteger2.default)(height) && height > 0) obj.height = height;else return;

  // 3: exifOrientation (optional) 
  var orient = parseInt(split[3]);
  if ((0, _isInteger2.default)(orient)) obj.exifOrientation = orient;

  // 4: exifDateTime (optional)
  if (validateExifDateTime(split[4])) obj.exifDateTime = split[4];

  // 5: exifMake
  if (split[5].length > 0) obj.exifMake = split[5];

  // 6: exifModel
  if (split[6].length > 0) obj.exifModel = split[6];

  var size = void 0;
  if (split[7].endsWith('B')) size = parseInt(split[7]);
  if ((0, _isInteger2.default)(size) && size > 0) obj.size = size;else return;

  return obj;
};

var Identify = function (_Worker) {
  (0, _inherits3.default)(Identify, _Worker);

  function Identify(fpath, uuid, hash) {
    (0, _classCallCheck3.default)(this, Identify);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Identify.__proto__ || (0, _getPrototypeOf2.default)(Identify)).call(this));

    _this.fpath = fpath;
    _this.uuid = uuid;
    _this.hash = hash;
    return _this;
  }

  (0, _createClass3.default)(Identify, [{
    key: 'run',
    value: function run() {
      var _this2 = this;

      (0, _xstat.readXstat)(this.fpath, function (err, xstat) {

        if (_this2.finished) return;
        if (err) return _this2.error(err);
        if (xstat.type !== 'file') return _this2.error(new _error2.default.ENOTFILE());
        if (xstat.uuid !== _this2.uuid) return _this2.error(new _error2.default.EINSTANCE());
        if (xstat.hash !== _this2.hash) return _this2.error(new _error2.default.ECONTENT());

        _child_process2.default.exec('identify -format \'' + identifyFormatString + '\' ' + _this2.fpath, function (err, stdout) {
          if (_this2.finished) return;
          if (err) return _this2.error(err);
          return (_this2.data = parseIdentifyOutput(stdout)) ? _this2.finish(_this2.data) : _this2.error(new _error2.default.EPARSE());
        });
      });
    }
  }]);
  return Identify;
}(_worker2.default);

exports.default = function (fpath, uuid, hash) {
  return new Identify(fpath, uuid, hash);
};