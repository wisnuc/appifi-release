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

// return meta data of all I can view
router.get('/', _auth2.default.jwt(), function (req, res) {

  var forest = _models2.default.getModel('forest');
  var user = req.user;

  var media = forest.getMedia(user.uuid);
  res.status(200).json(media);
});

router.get('/:digest/download', _auth2.default.jwt(), function (req, res) {

  var forest = _models2.default.getModel('forest');
  var user = req.user;
  var digest = req.params.digest;

  var filepath = forest.readMedia(user.uuid, digest);

  if (!filepath) return res.status(404).json({});

  res.status(200).sendFile(filepath);
});

exports.default = router;