'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMediaShareStore = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _util = require('./util');

var _paths = require('./paths');

var _paths2 = _interopRequireDefault(_paths);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MediaShareStore = function () {
  function MediaShareStore(rootdir, arcdir, tmpdir, docstore) {
    (0, _classCallCheck3.default)(this, MediaShareStore);

    this.rootdir = rootdir;
    this.arcdir = arcdir;
    this.tmpdir = tmpdir;
    this.docstore = docstore;
  }

  (0, _createClass3.default)(MediaShareStore, [{
    key: 'store',
    value: function store(doc, callback) {
      var _this = this;

      var uuid = doc.uuid;
      this.docstore.store(doc, function (err, digest) {
        if (err) return callback(err);
        var tmppath = _path2.default.join(_this.tmpdir, uuid);
        var dstpath = _path2.default.join(_this.rootdir, uuid);
        (0, _util.writeFileToDisk)(tmppath, digest, function (err) {
          if (err) return callback(err);
          _fs2.default.rename(tmppath, dstpath, function (err) {
            if (err) return callback(err);
            callback(null, { digest: digest, doc: doc });
          });
        });
      });
    }
  }, {
    key: 'archive',
    value: function archive(uuid, callback) {
      var srcpath = _path2.default.join(this.rootdir, uuid);
      var dstpath = _path2.default.join(this.arcdir, uuid);
      _fs2.default.rename(srcpath, dstpath, function (err) {
        return callback(err);
      });
    }
  }, {
    key: 'retrieve',
    value: function retrieve(uuid, callback) {
      var _this2 = this;

      var srcpath = _path2.default.join(this.rootdir, uuid);
      _fs2.default.readFile(srcpath, function (err, data) {
        if (err) return callback(err);
        var digest = data.toString();
        _this2.docstore.retrieve(digest, function (err, doc) {
          if (err) return callback(err);
          callback(null, { digest: digest, doc: doc });
        });
      });
    }
  }, {
    key: 'retrieveAll',
    value: function retrieveAll(callback) {
      var _this3 = this;

      _fs2.default.readdir(this.rootdir, function (err, entries) {
        if (err) return callback(err);

        var count = entries.length;
        if (!count) return callback(null, []);

        var result = [];
        entries.forEach(function (entry) {
          _this3.retrieve(entry, function (err, obj) {
            if (!err) result.push(obj);
            if (! --count) callback(null, result);
          });
        });
      });
    }
  }]);
  return MediaShareStore;
}();

var createMediaShareStore = function createMediaShareStore(docstore) {

  var rootdir = _paths2.default.get('mediashare');
  var arcdir = _paths2.default.get('mediashareArchive');
  var tmpdir = _paths2.default.get('tmp');

  return new MediaShareStore(rootdir, arcdir, tmpdir, docstore);
};

exports.createMediaShareStore = createMediaShareStore;