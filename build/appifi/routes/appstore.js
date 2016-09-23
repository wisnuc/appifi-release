'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _appstore = require('../lib/appstore');

var _appstore2 = _interopRequireDefault(_appstore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/', function (req, res) {
  _appstore2.default.reload();
  res.status(200).json({});
});

module.exports = router;