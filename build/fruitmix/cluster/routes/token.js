'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _jwtSimple = require('jwt-simple');

var _jwtSimple2 = _interopRequireDefault(_jwtSimple);

var _model = require('../model');

var _passportJwt = require('../../config/passportJwt');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

router.get('/', _auth2.default.basic(), function (req, res) {
  res.status(200).json({
    type: 'JWT',
    token: _jwtSimple2.default.encode({ uuid: req.user.uuid }, _passportJwt.secret)
  });
});

exports.default = router;