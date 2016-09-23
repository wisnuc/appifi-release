'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

router.get('/', function (req, res) {

  var User = _models2.default.getModel('user');
  var mapped = User.collection.list.map(function (usr) {
    return {
      uuid: usr.uuid,
      username: usr.username,
      avatar: usr.avatar
    };
  });

  res.status(200).json(mapped);
});

exports.default = router;