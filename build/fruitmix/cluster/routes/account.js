'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _express = require('express');

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _model = require('../model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// get account info
router.get('/', function (req, res) {

	var userUUID = req.user.uuid;
	(0, _model.localUsers)(function (err, users) {
		err ? res.status(500).json((0, _assign2.default)({}, err)) : res.status(200).json((0, _assign2.default)({}, users.filter(function (u) {
			return u.uuid === userUUID;
		})[0]));
	});

	// config.ipc.call('getAccountInfo', userUUID, (err, user) => {
	// 	err ? res.status(500).json({})
	// 		: res.status(200).json(Object.assign({}, user))
	// })
});

exports.default = router;