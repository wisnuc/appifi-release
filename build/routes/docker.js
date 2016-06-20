'use strict';

var _docker = require('../lib/docker');

var _docker2 = _interopRequireDefault(_docker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var express = require('express');


var router = express.Router();

router.get('/', function (req, res) {
  return res.status(200).json(_docker2.default.get());
});

router.get('/status', function (req, res) {
  return res.status(200).json(_docker2.default.status());
});

router.post('/', function (req, res) {
  return _docker2.default.operation(req.body, function (err, result) {
    return err ? res.status(500).json(err) : res.status(200).json(result);
  });
});

module.exports = router;