'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _const = require('../../lib/const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

//
router.get('/', _auth2.default.jwt(), function (req, res) {
  var userUUID = req.user.uuid;
  var folderUUID = req.user.library;
});

router.post('/:sha256', _auth2.default.jwt(), function (req, res) {

  var userUUID = req.user.uuid;
  var libraryUUID = req.user.library;

  var sha256 = req.params.sha256;

  var args = { sha256: sha256, libraryUUID: libraryUUID, src: '', check: true };

  _config2.default.ipc.call('createLibraryFile', args, function (err) {
    if (err) {
      if (err.code === 'EEXIST') return res.success(null, 200);

      return res.error(err, 500);
    }
    var form = new _formidable2.default.IncomingForm();
    form.hash = 'sha256';
    var abort = false;
    form.on('fileBegin', function (name, file) {
      file.path = _path2.default.join(process.cwd, _const.DIR.TMP, _nodeUuid2.default.v4());
    });

    form.on('file', function (name, file) {
      if (abort) return;
      if (sha256 !== file.hash) {
        return _fs2.default.unlink(file.path, function (err) {
          res.status(500).json({
            code: 'EAGAIN',
            message: 'sha256 mismatch'
          });
        });
      }

      args = { sha256: sha256, libraryUUID: libraryUUID, src: file.path, check: false };
      _config2.default.ipc.call('createLibraryFile', args, function (err, data) {
        if (err) return res.error(err);
        var entry = {
          digest: sha256,
          ctime: new Date().getTime()
        };
        return res.success(entry, 200);
      });
    });

    form.on('error', function (err) {
      if (abort) return;
      abort = true;
      return res.status(500).json({}); // TODO
    });

    form.parse(req);
  });
});

exports.default = router;