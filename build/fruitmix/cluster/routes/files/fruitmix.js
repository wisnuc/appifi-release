'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _paths = require('../../lib/paths');

var _paths2 = _interopRequireDefault(_paths);

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var Transform = require('stream').Transform;

var router = require('express').Router();
var UUID = require('node-uuid');

// list, tree and nav a directory
router.get('/:type/:dirUUID/:rootUUID', function (req, res, next) {
  var userUUID = req.user.uuid;
  var _req$params = req.params,
      type = _req$params.type,
      dirUUID = _req$params.dirUUID,
      rootUUID = _req$params.rootUUID;


  var typeObj = {
    'list': 'list',
    'tree': 'tree',
    'list-nav': 'navList',
    'tree-nav': 'navTree'
  };

  // next router
  if ((0, _keys2.default)(typeObj).indexOf(type) === -1) return next();

  var args = { userUUID: userUUID, dirUUID: dirUUID, rootUUID: rootUUID };

  _config2.default.ipc.call(typeObj[type], args, function (err, data) {
    if (err) return res.error(err);
    return res.success(data);
  });
});

// download a file
router.get('/download/:dirUUID/:fileUUID', function (req, res) {

  var userUUID = req.user.uuid;
  var _req$params2 = req.params,
      dirUUID = _req$params2.dirUUID,
      fileUUID = _req$params2.fileUUID;


  var args = { userUUID: userUUID, dirUUID: dirUUID, fileUUID: fileUUID };

  _config2.default.ipc.call('readFile', args, function (err, filepath) {
    if (err) return res.error(err);
    return res.status(200).sendFile(filepath);
  });
});

// mkdir 
// dirUUID cannot be a fileshare UUID
router.post('/mkdir/:dirUUID', function (req, res) {

  var userUUID = req.user.uuid;

  console.info('uuid:' + userUUID);

  var dirUUID = req.params.dirUUID;

  var dirname = req.body.dirname;
  var args = { userUUID: userUUID, dirUUID: dirUUID, dirname: dirname };

  _config2.default.ipc.call('createDirectory', args, function (err, data) {
    if (err) return res.error(err);
    return res.success(data);
  });
});

// upload a file
// query : filename=xxx
router.put('/upload/:dirUUID/:sha256', function (req, res) {
  var _req$params3 = req.params,
      dirUUID = _req$params3.dirUUID,
      sha256 = _req$params3.sha256;

  var filename = req.query.filename;
  var user = req.user;
  var finished = false;
  var tmpPath = path.join(_paths2.default.get('cluster_tmp'), UUID.v4());
  var error = function error(err) {
    if (finished) return;
    finished = true;
    res.error(err, 400);
  };

  var finish = function finish(newNode) {
    if (finished) return;
    finished = true;
    res.success(newNode, 200);
  };
  // TODO check createFileCheck
  var args = { userUUID: user.uuid, src: tmpPath, dirUUID: dirUUID, name: filename, hash: sha256, check: true };
  _config2.default.ipc.call('createFile', args, function (e) {

    if (e) return error(e);

    var hash = crypto.createHash('sha256');

    var writeStream = fs.createWriteStream(tmpPath);

    var hashTransform = new Transform({
      transform: function transform(buf, enc, next) {
        hash.update(buf, enc);
        this.push(buf);
        next();
      }
    });

    req.on('close', function () {
      return finished || (finished = true);
    });

    hashTransform.on('error', function (err) {
      return error(err);
    });

    writeStream.on('error', function (err) {
      return error(err);
    });

    writeStream.on('finish', function () {
      if (finished) return;
      if (hash.digest('hex') !== sha256) return error(new Error('hash mismatch'));

      var args = { userUUID: user.uuid, src: tmpPath, dirUUID: dirUUID, name: filename, hash: sha256, check: false };
      _config2.default.ipc.call('createFile', args, function (e, newNode) {
        if (e) return error(e);
        finish(newNode);
      });
    });

    req.pipe(hashTransform).pipe(writeStream);
  });
});

// overwrite a file     
// query string option ?filename=xxx
// TODO check need filename or fileUUID ? Jack
router.put('/overwrite/:dirUUID/:sha256', function (req, res) {
  var _req$params4 = req.params,
      dirUUID = _req$params4.dirUUID,
      sha256 = _req$params4.sha256;

  var filename = req.query.filename;
  var user = req.user;
  var finished = false;
  var tmpPath = path.join(_paths2.default.get('cluster_tmp'), UUID.v4());
  var error = function error(err) {
    if (finished) return;
    finished = true;
    res.error(err, 400);
  };

  var finish = function finish(newNode) {
    if (finished) return;
    finished = true;
    res.success(newNode, 200);
  };
  // TODO check createFileCheck
  var args = { userUUID: user.uuid, src: tmpPath, dirUUID: dirUUID, name: filename, hash: sha256, check: true };
  _config2.default.ipc.call('createFile', args, function (e) {

    if (e) return error(e);

    var hash = crypto.createHash('sha256');

    var writeStream = fs.createWriteStream(tmpPath);

    var hashTransform = new Transform({
      transform: function transform(buf, enc, next) {
        hash.update(buf, enc);
        this.push(buf);
        next();
      }
    });

    req.on('close', function () {
      return finished || (finished = true);
    });

    hashTransform.on('error', function (err) {
      return error(err);
    });

    writeStream.on('error', function (err) {
      return error(err);
    });

    writeStream.on('finish', function () {
      if (finished) return;
      if (hash.digest('hex') !== sha256) return error(new Error('hash mismatch'));

      var args = { userUUID: user.uuid, src: tmpPath, dirUUID: dirUUID, name: filename, hash: sha256, check: false };
      _config2.default.ipc.call('overwriteFile', args, function (e, newNode) {
        if (err) return error(err);
        finish(newNode);
      });
    });

    req.pipe(hashTransform).pipe(writeStream);
  });
});

// rename dir or file
router.patch('/rename/:dirUUID/:nodeUUID', function (req, res) {
  var _req$params5 = req.params,
      dirUUID = _req$params5.dirUUID,
      nodeUUID = _req$params5.nodeUUID;

  var filename = req.body.filename;
  _config2.default.ipc.call('rename', { userUUID: req.user.uuid, targetUUID: nodeUUID, dirUUID: dirUUID, name: filename }, function (err, node) {
    if (err) return res.error(err);
    return res.success(null, 200);
  });
});

// delete dir or file
// dirUUID cannot be a fileshare UUID
router.delete('/:dirUUID/:nodeUUID', function (req, res) {

  var userUUID = req.user.uuid;
  var _req$params6 = req.params,
      dirUUID = _req$params6.dirUUID,
      nodeUUID = _req$params6.nodeUUID;


  var args = { userUUID: userUUID, dirUUID: dirUUID, nodeUUID: nodeUUID };

  _config2.default.ipc.call('del', args, function (err, data) {
    if (err) return res.error(err);
    return res.success(data);
  });
});

module.exports = router;