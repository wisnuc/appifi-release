'use strict';

var _passportJwt = require('../config/passportJwt');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = require('express').Router();
var jwt = require('jwt-simple');


router.get('/', _auth2.default.basic(), function (req, res) {
  res.status(200).json({
    type: 'JWT',
    token: jwt.encode({ uuid: req.user.uuid }, _passportJwt.secret)
  });
});

module.exports = router;