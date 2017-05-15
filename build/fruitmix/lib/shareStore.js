'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMediaShareStoreAsync = exports.createFileShareStoreAsync = exports.createFileShareStore = exports.createMediaShareStore = undefined;

var _bluebird = require('bluebird');

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _util = require('./util');

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ShareStore = function () {
  function ShareStore(rootdir, arcdir, tmpdir, docstore) {
    (0, _classCallCheck3.default)(this, ShareStore);

    this.rootdir = rootdir;
    this.arcdir = arcdir;
    this.tmpdir = tmpdir;
    this.docstore = docstore;
  }

  (0, _createClass3.default)(ShareStore, [{
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
            callback(null, digest);
          });
        });
      });
    }

    // async storeAsync(doc) {

    //   // return new Promise((resolve, reject) => 
    //   //   this.store(doc, (err, digest) => 
    //   //     err ? reject(err) : resolve(digest)))

    //   // await Promise.promisify(this.store, { context: this })
    //   // or 
    //   return Promise.promisify(this.store).bind(this)(doc)
    // }

  }, {
    key: 'archive',
    value: function archive(uuid, callback) {
      var srcpath = _path2.default.join(this.rootdir, uuid);
      var dstpath = _path2.default.join(this.arcdir, uuid);
      _fs2.default.rename(srcpath, dstpath, function (err) {
        return callback(err);
      });
    }

    // async archiveAsync(uuid) {
    //   Promise.promisify(this.archive).bind(this)(uuid)
    // }

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
  return ShareStore;
}();

var createShareStore = function createShareStore(rootdir, arcdir, tmpdir, docstore, callback) {
  (0, _mkdirp2.default)(rootdir, function (err) {
    if (err) return callback(err);
    (0, _mkdirp2.default)(arcdir, function (err) {
      if (err) return callback(err);
      (0, _mkdirp2.default)(tmpdir, function (err) {
        if (err) return callback(err);
        callback(null, new ShareStore(rootdir, arcdir, tmpdir, docstore));
      });
    });
  });
};

var createMediaShareStore = function createMediaShareStore(froot, docstore, callback) {
  var rootdir = _path2.default.join(froot, _const.DIR.MSHARE);
  var arcdir = _path2.default.join(froot, _const.DIR.MSHAREARC);
  var tmpdir = _path2.default.join(froot, _const.DIR.TMP);

  createShareStore(rootdir, arcdir, tmpdir, docstore, callback);
};

var createFileShareStore = function createFileShareStore(froot, docstore, callback) {
  var rootdir = _path2.default.join(froot, _const.DIR.FSHARE);
  var arcdir = _path2.default.join(froot, _const.DIR.FSHAREARC);
  var tmpdir = _path2.default.join(froot, _const.DIR.TMP);

  createShareStore(rootdir, arcdir, tmpdir, docstore, callback);
};

var createFileShareStoreAsync = (0, _bluebird.promisify)(createFileShareStore);
var createMediaShareStoreAsync = (0, _bluebird.promisify)(createMediaShareStore);

exports.createMediaShareStore = createMediaShareStore;
exports.createFileShareStore = createFileShareStore;
exports.createFileShareStoreAsync = createFileShareStoreAsync;
exports.createMediaShareStoreAsync = createMediaShareStoreAsync;