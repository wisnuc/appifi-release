'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _appstore = require('../lib/appstore');

var _appstore2 = _interopRequireDefault(_appstore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/', function (req, res) {
  res.status(200).json(_appstore2.default.get());
});

router.post('/', function (req, res) {
  _appstore2.default.refresh(function (e, r) {
    if (e) return res.status(500);

    res.status(200).json(r);
  });
});

module.exports = router;