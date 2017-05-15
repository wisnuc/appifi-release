'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _express = require('express');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// get home, library & public drive
router.get('/', function (req, res) {
	_config2.default.ipc.call('getDrives', {}, function (err, drives) {
		err ? res.status(500).json({}) : res.status(200).json((0, _assign2.default)({}, { drives: drives }));
	});
});

// get drive info
router.get('/:driveUUID', function (req, res) {
	var driveUUID = req.params.driveUUID;
	_config2.default.ipc.call('getDriveInfo', driveUUID, function (err, drive) {
		err ? res.status(500).json({}) : res.status(200).json((0, _assign2.default)({}, drive));
	});
});

exports.default = router;