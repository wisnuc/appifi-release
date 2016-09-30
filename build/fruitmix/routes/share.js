'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

router.get('/sharedWithMe', _auth2.default.jwt(), function (req, res) {

  var forest = _models2.default.getModel('forest');
  var user = req.user;
  var shared = forest.getSharedWithMe(user.uuid);
  res.status(200).json(shared);
});

router.get('/sharedWithOthers', _auth2.default.jwt(), function (req, res) {

  var forest = _models2.default.getModel('forest');
  var user = req.user;
  var shared = forest.getSharedWithOthers(user.uuid);
  res.status(200).json(shared);
});

exports.default = router;