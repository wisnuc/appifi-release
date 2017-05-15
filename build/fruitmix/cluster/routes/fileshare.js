'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Router = require('express');


var router = Router();

// get all fileShares of a user
router.get('/', function (req, res) {
  var user = req.user;

  _config2.default.ipc.call('getUserFileShares', { userUUID: user.uuid }, function (err, shares) {
    if (err) return res.error(err, 400);
    res.success(shares);
  });
});

// create a fileShare
router.post('/', function (req, res) {
  var user = req.user;
  var props = (0, _assign2.default)({}, req.body);

  _config2.default.ipc.call('createFileShare', { userUUID: user.uuid, props: props }, function (err, share) {
    if (err) return res.error(err, 500);
    res.success(share);
  });
});

// update a fileShare
router.patch('/:shareUUID', function (req, res) {
  var user = req.user;
  var shareUUID = req.params.shareUUID;
  var props = (0, _assign2.default)({}, req.body);

  _config2.default.ipc.call('updateFileShare', { userUUID: user.uuid, shareUUID: shareUUID, props: props }, function (err, newShare) {
    if (err) return res.error(err, 500);
    res.success(newShare);
  });
});

// delete a fileShare 
router.delete('/:shareUUID', function (req, res) {
  var user = req.user;
  var shareUUID = req.params.shareUUID;

  _config2.default.ipc.call('deleteFileShare', { userUUID: user.uuid, shareUUID: shareUUID }, function (err, data) {
    if (err) return res.error(err, 500);
    res.success();
  });
});

exports.default = router;