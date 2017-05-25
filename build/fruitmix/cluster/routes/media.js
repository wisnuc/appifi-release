'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _const = require('../../lib/const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');
var UUID = require('node-uuid');
var formidable = require('formidable');
var router = require('express').Router();

// get mata data of all I can view
router.get('/', function (req, res) {

  var userUUID = req.user.uuid;

  _config2.default.ipc.call('getMeta', userUUID, function (err, data) {
    if (err) return res.error(err);
    return res.success(data);
  });
});

router.get('/:digest/download', function (req, res) {

  var userUUID = req.user.uuid;
  var digest = req.params.digest;

  _config2.default.ipc.call('readMedia', { userUUID: userUUID, digest: digest }, function (err, filepath) {
    if (err) return res.error(err);
    return res.status(200).sendFile(filepath);
  });
});

/**
  use query string, possible options:

  width: 'integer',
  height: 'integer'
  modifier: 'caret',      // optional
  autoOrient: 'true',     // optional
  instant: 'true',        // optional
  nonblock: 'true'        // optional

  width and height, provide at least one
  modifier effectvie only if both width and height provided
**/

router.get('/:digest/thumbnail', function (req, res) {

  var requestId = UUID.v4();
  // let userUUID = req.user.uuid
  var digest = req.params.digest;
  var query = req.query;

  req.on('close', function () {
    _config2.default.ipc.call('abort', { requestId: requestId, digest: digest, query: query }, function () {});
  });

  _config2.default.ipc.call('getThumb', { requestId: requestId, digest: digest, query: query }, function (err, ret) {
    if (err) {
      return res.error(err);
    }

    if ((typeof ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(ret)) === 'object') {
      return res.status(202).json(ret);
    } else {
      return res.status(200).sendFile(ret);
    }
  });
});

// old libraries api
router.post('/:digest', function (req, res) {
  // let userUUID = req.user.uuid
  var libraryUUID = req.user.library;

  var sha256 = req.params.digest;

  var args = { sha256: sha256, libraryUUID: libraryUUID, src: '', check: true };

  _config2.default.ipc.call('createLibraryFile', args, function (err) {
    if (err) {
      if (err.code === 'EEXIST') return res.success(null, 200);

      console.log('err1: ', err);
      return res.error(err, 500);
    }
    var form = new formidable.IncomingForm();
    form.hash = 'sha256';
    var abort = false;
    form.on('fileBegin', function (name, file) {
      file.path = path.join(_config2.default.path, _const.DIR.TMP, UUID.v4());
    });

    form.on('file', function (name, file) {
      if (abort) return;
      if (sha256 !== file.hash) {
        return fs.unlink(file.path, function (err) {

          console.log('err2: ', err);
          res.status(500).json({
            code: 'EAGAIN',
            message: 'sha256 mismatch'
          });
        });
      }

      args = { sha256: sha256, libraryUUID: libraryUUID, src: file.path, check: false };
      _config2.default.ipc.call('createLibraryFile', args, function (err, data) {
        if (err) {
          console.log('err3: ', err);
          return res.error(err);
        }
        var entry = {
          digest: sha256,
          ctime: new Date().getTime()
        };
        return res.success(entry, 200);
      });
    });

    //FIXME:
    form.on('error', function (err) {
      if (abort) return;
      abort = true;
      console.log('err4: ', err.message);
      return res.status(500).json({}); // TODO
    });

    form.parse(req);
  });
});

module.exports = router;