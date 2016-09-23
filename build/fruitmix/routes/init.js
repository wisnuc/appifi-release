'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _express = require('express');

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

router.post('/', function (req, res) {

  var repo = _models2.default.getModel('repo');
  var userModel = _models2.default.getModel('user');

  // if user exists
  if (userModel.collection.list.length) return res.status(404).end();

  // let Repo = Models.getModel('repo')

  var props = req.body;
  props.type = 'local';

  userModel.createUser(props, function (err, user) {

    if (err) return res.status(err.code === 'EINVAL' ? 400 : 500).json({
      code: err.code,
      message: err.message
    });

    repo.createUserDrives(user, function (err) {

      if (err) return callback(err);

      res.status(200).json((0, _assign2.default)({}, user, {
        password: undefined,
        smbPassword: undefined,
        smbLastChangeTime: undefined
      }));
    });
  });
});

exports.default = router;