'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _express = require('express');

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _sanitizeFilename = require('sanitize-filename');

var _sanitizeFilename2 = _interopRequireDefault(_sanitizeFilename);

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// this may be either file or folder
// if it's a folder, return childrens
// if it's a file, download
// /files/xxxxxxx <- must be folder
router.get('/:nodeUUID', _auth2.default.jwt(), function (req, res) {

  var repo = _models2.default.getModel('repo');
  var filer = _models2.default.getModel('filer');
  var user = req.user;
  var query = req.query;

  var node = filer.findNodeByUUID(req.params.nodeUUID);
  if (!node) {
    return res.status(500).json({
      code: 'ENOENT',
      message: 'node not found'
    });
  }

  if (node.isDirectory()) {

    var ret = query.navroot ? filer.navFolder(user.uuid, node.uuid, query.navroot) : filer.listFolder(user.uuid, node.uuid);

    if (ret instanceof Error) {
      res.status(500).json({
        code: ret.code,
        message: ret.message
      });
    } else {
      res.status(200).json(ret);
    }
  } else if (node.isFile()) {
    var filepath = filer.readFile(user.uuid, node.uuid);
    res.status(200).sendFile(filepath);
  } else {
    res.status(404).end(); // TODO
  }
});

// this can only be folders
// create a subfolder or a file in folder
router.post('/:nodeUUID', _auth2.default.jwt(), function (req, res) {

  var repo = _models2.default.getModel('repo');
  var filer = _models2.default.getModel('filer');
  var user = req.user;

  var node = filer.findNodeByUUID(req.params.nodeUUID);
  if (!node) {
    return res.status(500).json({ // TODO
      code: 'ENOENT'
    });
  }

  // this is going to create something in folder, either file or folder
  if (node.isDirectory()) {

    if (req.is('multipart/form-data')) {
      (function () {
        // uploading a new file into folder

        var sha256 = void 0,
            abort = false;

        var form = new _formidable2.default.IncomingForm();
        form.hash = 'sha256';

        form.on('field', function (name, value) {
          if (name === 'sha256') sha256 = value;
        });

        form.on('fileBegin', function (name, file) {
          if ((0, _sanitizeFilename2.default)(file.name) !== file.name) {
            abort = true;
            return res.status(500).json({}); // TODO
          }
          if (node.getChildren().find(function (child) {
            return child.name === file.name;
          })) {
            abort = true;
            return res.status(500).json({}); // TODO
          }
          file.path = _path2.default.join(repo.getTmpFolderForNode(node), _nodeUuid2.default.v4());
        });

        form.on('file', function (name, file) {

          if (abort) return;
          if (sha256 !== file.hash) {
            return _fs2.default.unlink(file.path, function (err) {
              res.status(500).json({}); // TODO
            });
          }

          filer.createFile(user.uuid, file.path, node, file.name, function (err, newNode) {
            return res.status(200).json((0, _assign2.default)({}, newNode, {
              parent: newNode.parent.uuid
            }));
          });
        });

        // this may be fired after user abort, so response is not guaranteed to send
        form.on('error', function (err) {
          abort = true;
          return res.status(500).json({
            code: err.code,
            message: err.message
          });
        });

        form.parse(req);
      })();
    } else {
      // creating a new sub-folder in folder

      var name = req.body.name;
      if (typeof name !== 'string' || (0, _sanitizeFilename2.default)(name) !== name) {
        return res.status(500).json({}); // TODO
      }

      filer.createFolder(user.uuid, node, name, function (err, newNode) {
        if (err) return res.status(500).json({}); // TODO
        res.status(200).json((0, _assign2.default)({}, newNode, {
          parent: newNode.parent.uuid
        }));
      });
    }
  } else if (node.isFile()) {

    if (req.is('multipart/form-data')) {
      (function () {
        // overwriting an existing file

        var sha256 = void 0,
            abort = false;
        var form = new _formidable2.default.IncomingForm();
        form.hash = 'sha256';

        form.on('field', function (name, value) {
          if (name === 'sha256') sha256 = value;
        });

        form.on('fileBegin', function (name, file) {
          file.path = _path2.default.join(repo.getTmpFolderForNode(node), _nodeUuid2.default.v4());
        });

        form.on('file', function (name, file) {
          if (abort) return;
          if (sha256 !== file.hash) {
            return _fs2.default.unlink(file.path, function (err) {
              res.status(500).json({}); // TODO
            });
          }

          filer.overwriteFile(user.uuid, file.path, node, function (err, newNode) {
            if (err) return res.status(500).json({}); // TODO
            res.status(200).json((0, _assign2.default)({}, newNode, {
              parent: newNode.parent.uuid
            }));
          });
        });

        form.on('error', function (err) {
          if (abort) return;
          abort = true;
          return res.status(500).json({
            code: err.code,
            message: err.message
          });
        });

        form.parse(req);
      })();
    } else {
      //
      return res.status(404).end();
    }
  }
});

// rename file or folder inside a folder
// 
router.patch('/:folderUUID/:nodeUUID', _auth2.default.jwt(), function (req, res) {

  var isUUID = function isUUID(uuid) {
    return typeof uuid === 'string' && _validator2.default.isUUID(uuid);
  };
  var isUUIDArray = function isUUIDArray(arr) {
    return Array.isArray(arr) && arr.every(isUUID);
  };
  var bothUUIDArray = function bothUUIDArray(w, r) {
    return isUUIDArray(w) && isUUIDArray(r);
  };
  var oneUUIDArrayTheOtherUndefined = function oneUUIDArrayTheOtherUndefined(w, r) {
    return isUUIDArray(w) && r === undefined || w === undefined && isUUIDArray(r);
  };
  var bothNull = function bothNull(w, r) {
    return w === null && r === null;
  };

  var repo = _models2.default.getModel('repo');
  var filer = _models2.default.getModel('filer');
  var user = req.user;

  var folderUUID = req.params.folderUUID;
  var nodeUUID = req.params.nodeUUID;

  if (typeof folderUUID !== 'string' || !_validator2.default.isUUID(folderUUID) || typeof nodeUUID !== 'string' || !_validator2.default.isUUID(nodeUUID)) return res.status(400).json({
    code: 'EINVAL',
    message: 'malformed folder uuid or node uuid'
  });

  var folder = filer.findNodeByUUID(folderUUID);
  var node = filer.findNodeByUUID(nodeUUID);
  if (!folder || !node || node.parent !== folder) return res.stauts(404).json({
    code: 'ENOENT',
    message: 'either folder or child not found, or they are not parent-child'
  });

  var obj = req.body;
  if ((typeof obj === 'undefined' ? 'undefined' : (0, _typeof3.default)(obj)) !== 'object') return res.status(400).json({
    code: 'EINVAL',
    message: 'request body is not an object'
  });

  if (obj.name) {

    if (typeof obj.name !== 'string' || obj.name !== (0, _sanitizeFilename2.default)(obj.name)) return res.status(400).json({
      code: 'EINVAL',
      message: 'bad name property'
    });

    filer.rename(user.uuid, folder, node, obj.name, function (err, newNode) {

      if (err) return res.status(500).json({
        code: err.code,
        message: err.message
      });

      return res.status(200).json((0, _assign2.default)({}, newNode, {
        parent: undefined,
        children: undefined
      }));
    });
  } else if (bothUUIDArray(obj.writelist, obj.readlist) || oneUUIDArrayTheOtherUndefined(obj.writelist, obj.readlist) || bothNull(obj.writelist, obj.readlist)) {

    if (obj.writelist) {
      if (!obj.readlist) obj.readlist = [];
    } else if (obj.readlist) {
      if (!obj.writelist) obj.writelist = [];
    } else {
      obj.writelist = undefined;
      obj.readlist = undefined;
    }

    filer.updatePermission(user.uuid, folder, node, obj, function (err, newNode) {

      if (err) return res.status(500).json({
        code: err.code,
        message: err.message
      });

      return res.status(200).json((0, _assign2.default)({}, newNode, {
        parent: undefined,
        children: undefined
      }));
    });
  } else {
    return res.status(400).json({
      code: 'EINVAL',
      message: 'no valid name or permission props found'
    });
  }
});

// this may be either file or folder
router.delete('/:folderUUID/:nodeUUID', _auth2.default.jwt(), function (req, res) {

  var repo = _models2.default.getModel('repo');
  var filer = _models2.default.getModel('filer');
  var user = req.user;

  var folderUUID = req.params.folderUUID;
  var nodeUUID = req.params.nodeUUID;

  var folder = filer.findNodeByUUID(folderUUID);
  var node = filer.findNodeByUUID(nodeUUID);

  filer.deleteFileOrFolder(user.uuid, folder, node, function (err) {
    if (err) res.status(500).json(null);
    res.status(200).json(null);
  });
});

exports.default = router;