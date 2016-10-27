'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMetaBuilder = exports.MetaBuilder = exports.createIdentifyWorker = exports.parseIdentifyOutput = exports.validateExifDateTime = undefined;

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

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

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

// uuid and digest is required because this function should
// check if uuid and digest matches.
// EISDIR w/o errno, EMISMATCH
var createIdentifyWorker = exports.createIdentifyWorker = function createIdentifyWorker(target, uuid, digest, callback) {

  var finished = false;
  var spawn = void 0,
      meta = void 0;

  (0, _xstat.readXstat)(target, function (err, xstat) {

    if (finished) return;
    if (err) return CALLBACK(err);

    // readXstat guarantees the target is either a regular file or a folder, but not others
    // so is safe to return EISDIR as error code
    if (xstat.isDirectory()) return CALLBACK((0, _assign2.default)(new Error('target must be a file'), { code: 'EISDIR' }));

    if (xstat.uuid !== uuid) return CALLBACK((0, _assign2.default)(new Error('uuid mismatch'), { code: 'EMISMATCH' }));

    if (xstat.hash !== digest) return CALLBACK((0, _assign2.default)(new Error('digest mismatch'), { code: 'EHASHMISMATCH' }));

    spawn = _child_process2.default.spawn('identify', ['-format', identifyFormatString, target]);

    spawn.stdout.on('data', function (data) {
      if (finished) return;
      var obj = parseIdentifyOutput(data.toString());
      if (obj) meta = obj;
    });

    spawn.on('close', function (code) {
      spawn = null;
      if (finished) return;
      if (code !== 0 || !meta) {
        console.log('IdentifyWorker fail with code ' + code);
        CALLBACK((0, _assign2.default)(new Error('identify failed')), { code: 'EFAIL' });
      } else CALLBACK(null, meta);
    });
  });

  return function () {
    if (finished) return;
    if (spawn) {
      spawn.kill();
      spawn = null;
    }
    CALLBACK((0, _assign2.default)(new Error('aborted'), { code: 'EABORT' }));
  };

  function CALLBACK(err, data) {
    finished = true;
    callback(err, data);
  }
};

var MetaBuilder = exports.MetaBuilder = function (_EventEmitter) {
  (0, _inherits3.default)(MetaBuilder, _EventEmitter);

  function MetaBuilder(filer) {
    var limit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
    (0, _classCallCheck3.default)(this, MetaBuilder);

    var _this = (0, _possibleConstructorReturn3.default)(this, (MetaBuilder.__proto__ || (0, _getPrototypeOf2.default)(MetaBuilder)).call(this));

    _this.filer = filer;
    _this.limit = limit;
    _this.running = []; // job array
    _this.pending = []; // digest array

    _this.filer.on('meta', function (digest) {
      _this.handle(digest);
    });

    _this.aborted = false;
    return _this;
  }

  (0, _createClass3.default)(MetaBuilder, [{
    key: 'createJob',
    value: function createJob(digest) {
      var _this2 = this;

      var digestObj = this.filer.findDigestObject(digest);

      if (!digestObj) return null;
      if (!digestObj.nodes || digestObj.nodes.length === 0) return null;
      if (digestObj.meta) return null;

      var node = digestObj.nodes[0];
      var uuid = node.uuid;
      var target = node.namepath();
      var abort = void 0;

      switch (digestObj.type) {
        case 'JPEG':
          abort = createIdentifyWorker(target, uuid, digest, function (err, meta) {
            return _this2.jobDone(err, meta, job);
          });
          break;

        default:
          return null;
      }

      var job = { digest: digest, uuid: uuid, abort: abort };
      this.running.push(job);
    }
  }, {
    key: 'jobDone',
    value: function jobDone(err, meta, job) {
      var _this3 = this;

      if (err) {
        switch (err.code) {
          case 'EABORT':
            break;

          default:
            break;
        }
      } else {

        var digestObj = this.filer.findDigestObject(job.digest);

        if (!digestObj) return;
        if (!digestObj.nodes || digestObj.nodes.length === 0) return;
        if (digestObj.meta) return;
        if (!digestObj.nodes.find(function (node) {
          return node.uuid === job.uuid;
        })) return;

        digestObj.meta = meta;
      }

      this.running.splice(this.running.indexOf(job), 1);
      if (!this.running.length && !this.pending.length) {
        // process.nextTick(() => this.emit('metaBuilderStopped'))
        this.emit('metaBuilderStopped');
      }

      // it doesn't matter whether schedule is called or not after abort
      // schedule works only when pending queue non-empty, which is not true after abort
      process.nextTick(function () {
        return _this3.schedule();
      });
    }
  }, {
    key: 'schedule',
    value: function schedule() {
      while (this.limit - this.running.length > 0 && this.pending.length) {
        var digest = this.pending.shift();
        this.createJob(digest);
      }
    }
  }, {
    key: 'handle',
    value: function handle(digest) {

      if (this.aborted) return;

      if (this.running.find(function (r) {
        return r.digest === digest;
      })) return;
      if (this.pending.find(function (dgst) {
        return dgst === digest;
      })) return;

      if (this.running.length >= this.limit) this.pending.push(digest);else {
        this.createJob(digest);
        if (this.running.length === 1 && this.pending.length === 0) {
          this.emit('metaBuilderStarted');
        }
      }
    }
  }, {
    key: 'abort',
    value: function abort() {
      this.pending = [];
      this.running.forEach(function (job) {
        return job.abort();
      });
      this.aborted = true;
    }
  }]);
  return MetaBuilder;
}(_events2.default);

var createMetaBuilder = exports.createMetaBuilder = function createMetaBuilder(filer, limit) {
  return new MetaBuilder(filer, limit);
};