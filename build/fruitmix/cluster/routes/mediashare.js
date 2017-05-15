'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _express = require('express');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// get all mediaShares of a user

// import auth from '../middleware/auth'
router.get('/', function (req, res) {
  var user = req.user;
  _config2.default.ipc.call('getUserMediaShares', { userUUID: user.uuid }, function (err, shares) {
    if (err) return res.error(err, 400);
    res.success(shares);
  });
});

// create a mediaShare
router.post('/', function (req, res) {
  var user = req.user;
  var props = (0, _assign2.default)({}, req.body);

  _config2.default.ipc.call('createMediaShare', { userUUID: user.uuid, props: props }, function (err, share) {
    if (err) return res.error(err, 500);
    res.success(share);
  });
});

// update a mediaShare
router.patch('/:shareUUID', function (req, res) {
  var user = req.user;
  var shareUUID = req.params.shareUUID;
  var props = (0, _assign2.default)({}, req.body);

  _config2.default.ipc.call('updateMediaShare', { userUUID: user.uuid, shareUUID: shareUUID, props: props }, function (err, newShare) {
    if (err) return res.error(err, 500);
    res.success(newShare);
  });
});

// delete a mediaShare 
router.delete('/:shareUUID', function (req, res) {
  var user = req.user;
  var shareUUID = req.params.shareUUID;

  _config2.default.ipc.call('deleteMediaShare', { userUUID: user.uuid, shareUUID: shareUUID }, function (err, data) {
    if (err) return res.error(err, 500);
    res.success();
  });
});

exports.default = router;