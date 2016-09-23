'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMediaTalkStore = undefined;

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MediaTalkStore = function () {
  function MediaTalkStore(rootdir, tmpdir, docstore) {
    (0, _classCallCheck3.default)(this, MediaTalkStore);

    this.rootdir = rootdir;
    this.tmpdir = tmpdir;
    this.docstore = docstore;
  }

  (0, _createClass3.default)(MediaTalkStore, [{
    key: 'store',
    value: function store(doc, callback) {
      var _this = this;

      var name = doc.owner + '.' + doc.digest;
      this.docstore.store(doc, function (err, digest) {
        if (err) return callback(err);
        var tmppath = _path2.default.join(_this.tmpdir, _nodeUuid2.default.v4());
        var dstpath = _path2.default.join(_this.rootdir, name);
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
    key: 'retrieve',
    value: function retrieve(owner, digest, callback) {
      var _this2 = this;

      var srcpath = _path2.default.join(this.rootdir, owner + '.' + digest);
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
  return MediaTalkStore;
}();

var createMediaTalkStore = function createMediaTalkStore(rootdir, tmpdir, docstore) {
  return new MediaTalkStore(rootdir, tmpdir, docstore);
};

exports.createMediaTalkStore = createMediaTalkStore;