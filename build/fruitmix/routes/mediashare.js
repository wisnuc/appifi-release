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

router.get('/', _auth2.default.jwt(), function (req, res) {

  var Media = _models2.default.getModel('media');
  var user = req.user;

  try {
    var shares = Media.getUserShares(user.uuid);
    res.status(200).json(shares);
  } catch (e) {
    console.log(e);
  }
});

router.post('/', _auth2.default.jwt(), function (req, res) {

  var Media = _models2.default.getModel('media');
  var user = req.user;

  Media.createMediaShare(user.uuid, req.body, function (err, doc) {

    if (err) return res.status(500).json({}); // TODO
    res.status(200).json(doc);
  });
});

exports.default = router;