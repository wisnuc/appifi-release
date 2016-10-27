'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

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

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// this endpoint should return a list of libraries, which is
// acturally a list of folders inside the library drive
router.get('/', _auth2.default.jwt(), function (req, res) {

  var filer = _models2.default.getModel('filer');

  var userUUID = req.user.uuid;
  var folderUUID = req.user.library;

  var list = filer.listFolder(userUUID, folderUUID).filter(function (n) {
    return n.type === 'folder';
  }).map(function (n) {
    return n.uuid;
  });

  res.status(200).json(list);
});

// this endpoints should upload a file into given
// folder
router.post('/', _auth2.default.jwt(), function (req, res) {

  var filer = _models2.default.getModel('filer');

  var folderUUID = req.user.library;
  var node = filer.findNodeByUUID(folderUUID);

  filer.createFolder(req.user.uuid, node, _nodeUuid2.default.v4(), function (err, newNode) {
    if (err) return res.status(500).json({
      code: err.code,
      message: err.message
    });

    res.status(200).json({
      uuid: newNode.uuid
    });
  });
});

router.post('/:libUUID', _auth2.default.jwt(), function (req, res) {

  // FIXME check content type, 'Content-Type: multipart/form-data'
  //                                          application/json

  var repo = _models2.default.getModel('repo');

  var filer = _models2.default.getModel('filer');
  var log = _models2.default.getModel('log');
  var user = req.user;
  var libUUID = req.params.libUUID;

  var node = filer.findNodeByUUID(libUUID);

  // FIXME node parent must be users lib
  // node must be folder

  var sha256 = void 0,
      abort = false;

  var form = new _formidable2.default.IncomingForm();
  form.hash = 'sha256';

  form.on('field', function (name, value) {
    // console.log('field ' + name + ' ' + value)
    if (name === 'sha256') sha256 = value;
  });

  form.on('fileBegin', function (name, file) {
    // console.log('fileBegin ' + name)
    file.path = _path2.default.join(repo.getTmpFolderForNode(node), _nodeUuid2.default.v4());
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

    filer.createFile(user.uuid, file.path, node, '' + sha256, function (err, newNode) {
      // check error code FIXME should return success if EEXIST
      if (err) return res.status(500).json({}); // TODO

      var entry = {
        digest: sha256,
        ctime: new Date().getTime()
      };

      log.append(libUUID, (0, _stringify2.default)(entry), function (err) {
        res.status(200).json(entry);
      });
    });
  });

  form.on('error', function (err) {
    if (abort) return;
    abort = true;
    return res.status(500).json({}); // TODO
  });

  form.parse(req);
});

// this endpoint should return an upload log
router.get('/:libUUID/log', _auth2.default.jwt(), function (req, res) {

  var user = req.user;
  var libUUID = req.params.libUUID;

  var log = _models2.default.getModel('log');
  var filer = _models2.default.getModel('filer');
  var repo = _models2.default.getModel('repo');

  var node = filer.findNodeByUUID(libUUID);

  if (!node) return res.status(404).json({});
  if (node.parent.uuid !== user.library) return res.status(404).json({}); // FIXME

  log.get(libUUID, function (err, lines) {

    if (err) return res.status(500).json({});

    var arr = [];
    lines.forEach(function (l) {
      try {
        var obj = JSON.parse(l);
        arr.push(obj);
      } catch (e) {}
    });

    res.status(200).json(arr);
  });
});

exports.default = router;