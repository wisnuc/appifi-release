'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _storage = require('../lib/storage');

var _storage2 = _interopRequireDefault(_storage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.post('/', function (req, res) {
  return _storage2.default.operation(req.body, function (err, result) {
    return err ? res.status(500).json(err) : res.status(200).json(result);
  });
});

module.exports = router;