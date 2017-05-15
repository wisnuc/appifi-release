'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = require('express').Router();

router.post('/', function (req, res) {

  if ((0, _typeof3.default)(req.body) !== 'object' || req.body === null) return res.status(400).json({ code: 'EINVAL', message: 'invalid arguments' });

  var props = (0, _assign2.default)(req.body, { type: 'local' });
  _config2.default.ipc.call('createLocalUser', { props: req.body }, function (err, firstUser) {
    if (err) return res.status(500).json({ code: err.code, message: err.message });else return res.status(200).json(firstUser);
  });
});

exports.default = router;