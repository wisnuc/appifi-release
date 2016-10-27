'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

router.get('/', _auth2.default.jwt(), function (req, res) {

  var filer = _models2.default.getModel('filer');
  var user = req.user;
  var meta = filer.getMeta(user.uuid);
  res.status(200).json(meta);
});

exports.default = router;