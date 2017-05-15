'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fsXattr = require('fs-xattr');

var _fsXattr2 = _interopRequireDefault(_fsXattr);

var _express = require('express');

var _formidable = require('formidable');

var _formidable2 = _interopRequireDefault(_formidable);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _filemap = require('../lib/filemap');

var _paths = require('../lib/paths');

var _paths2 = _interopRequireDefault(_paths);

var _error = require('../../lib/error');

var _error2 = _interopRequireDefault(_error);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

//create filemap
router.post('/:nodeUUID', function (req, res) {
  console.log(1233);
  var user = req.user;
  var name = req.body.filename;
  var dirUUID = req.params.nodeUUID;
  // let args =  { userUUID:user.uuid, dirUUID, name }
  // config.ipc.call('createFileCheck', args, (err, node) => {
  //   if(err) return res.error(err, 400)
  //   if(!node.isDirectory()) return res.error(null, 400)
  if (!req.is('multipart/form-data')) {
    //create fileMap
    var _req$body = req.body,
        size = _req$body.size,
        segmentsize = _req$body.segmentsize,
        sha256 = _req$body.sha256;

    var args = { size: size, segmentsize: segmentsize, dirUUID: dirUUID, sha256: sha256, name: name, userUUID: user.uuid };
    (0, _filemap.createFileMap)(args, function (e, attr) {
      if (e) return res.error(e, 500);
      return res.success(attr, 200);
    });
  } else return res.error(null, 404);
  // })
});

//Maybe like /nodeuuid?filename=xxx&segmenthash=xxx&start=xx&taskid=xxx
router.put('/:nodeUUID', function (req, res) {
  var user = req.user;
  var segmentHash = req.query.segmenthash;
  var start = parseInt(req.query.start);
  var taskId = req.query.taskid;

  (0, _filemap.updateSegmentAsync)(user.uuid, req.params.nodeUUID, segmentHash, start, taskId, req).asCallback(function (err, data) {
    if (err) return res.error(err, 400);
    return res.success(null, 200);
  });
});

router.get('/', function (req, res) {
  (0, _filemap.readFileMapList)(req.user.uuid, function (e, list) {
    if (e) return res.error(e, 500);
    return res.success(list, 200);
  });
});

router.get('/:taskId', function (req, res) {
  (0, _filemap.readFileMap)(req.user.uuid, req.params.taskId, function (e, attr) {
    if (e) return res.error(e, 500);
    return res.success(attr, 200);
  });
});

router.delete('/:taskId', function (req, res) {
  (0, _filemap.deleteFileMap)(req.user.uuid, req.params.taskId, function (err) {
    if (err) return res.error(err, 500);
    return res.success(null, 200);
  });
});

exports.default = router;