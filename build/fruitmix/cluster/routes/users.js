'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _express = require('express');

var _model = require('../model');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// get user friends
router.get('/', function (req, res) {
  var useruuid = req.user.uuid;
  _config2.default.ipc.call('getUserFriends', useruuid, function (err, friends) {
    err ? res.status(500).json({}) : res.status(200).json((0, _assign2.default)({}, { friends: friends }));
  });
});

//req.body 
// {
//       type, username, password, nologin, isFirstUser,
//       isAdmin, email, avatar, unixname
// }

// create user
router.post('/', function (req, res) {

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

// update user information or password
router.patch('/:userUUID', function (req, res) {

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

// determine whether local users
router.get('/isLocalUser', function (req, res) {
  var user = req.user;
  _config2.default.ipc.call('isLocalUser', user.uuid, function (err, isLocal) {
    err ? res.status(500).json({}) : res.status(200).json((0, _assign2.default)({}, { isLocal: isLocal }));
  });
});

exports.default = router;