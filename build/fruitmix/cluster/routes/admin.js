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

// get all local user info
router.get('/users', function (req, res) {

  // permission useruuid
  var useruuid = req.user.uuid;
  _config2.default.ipc.call('getAllLocalUser', useruuid, function (err, users) {
    err ? res.status(500).json((0, _assign2.default)({}, err)) : res.status(200).json((0, _assign2.default)({}, { users: users }));
  });
});

// admin create user
router.post('/users', function (req, res) {

  // permission user uuid
  var useruuid = req.user.uuid;

  var props = (0, _assign2.default)({}, req.body);

  if (props.type === 'local') {
    // create local user
    _config2.default.ipc.call('createLocalUser', { useruuid: useruuid, props: props }, function (err, user) {
      err ? res.status(500).json(err) : res.status(200).json(user);
    });
  } else if (props.type === 'remote') {
    // create remote user
    _config2.default.ipc.call('createRemoteUser', { useruuid: useruuid, props: props }, function (err, user) {
      err ? res.status(500).json(err) : res.status(200).json(user);
    });
  } else {
    res.status(400).json({ message: 'invalid user type, must be local or remote' });
  }
});

// admin update user
router.patch('/users/:userUUID', function (req, res) {

  // permission user uuid
  var useruuid = req.user.uuid;
  var props = (0, _assign2.default)({}, req.body, {
    uuid: req.params.userUUID
  });

  if (!props.uuid) return res.status(400).json('uuid is missing');

  if (props.password) {
    // update password
    _config2.default.ipc.call('updatePassword', { useruuid: useruuid, props: props }, function (err, aaa) {
      err ? res.status(500).json(err) : res.status(200).json({ message: 'change password sucessfully' });
    });
  } else {
    // update user without password
    _config2.default.ipc.call('updateUser', { useruuid: useruuid, props: props }, function (err, user) {
      err ? res.status(500).json(err) : res.status(200).json(user);
    });
  }
});

// get all public drive
router.get('/drives', function (req, res) {
  var useruuid = req.user.uuid;
  _config2.default.ipc.call('getAllPublicDrive', useruuid, function (err, drives) {
    err ? res.status(500).json((0, _assign2.default)({}, err)) : res.status(200).json((0, _assign2.default)({}, { drives: drives }));
  });
});

// add pulbic drive
router.post('/drives', function (req, res) {
  // permission useruuid
  var useruuid = req.user.uuid;
  var drive = req.body;
  _config2.default.ipc.call('createPublicDrive', { useruuid: useruuid, props: drive }, function (err, drive) {
    err ? res.status(500).json((0, _assign2.default)({}, err)) : res.status(200).json((0, _assign2.default)({}, { drive: drive }));
  });
});

// update public drive
router.patch('/drives/:driveUUID', function (req, res) {
  // permission useruuid
  var useruuid = req.user.uuid;
  var props = (0, _assign2.default)({}, req.body, {
    uuid: req.params.driveUUID
  });
  _config2.default.ipc.call('updatePublicDrive', { useruuid: useruuid, props: props }, function (err, drive) {
    err ? res.status(500).json((0, _assign2.default)({}, err)) : res.status(200).json((0, _assign2.default)({}, { drive: drive }));
  });
});

exports.default = router;