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

/**

Drive {
 domain: null,
 _events: [Object],
 _eventsCount: 1,
 _maxListeners: undefined,
 proto: [Object],
 uuidMap: [Object],
 hashMap: [Object],
 hashless: [Object],
 shares: [Object],
 root: [Object],
 uuid: '6586789e-4a2c-4159-b3da-903ae7f10c2a',
 owner: [Object],
 writelist: [],
 readlist: [],
 fixedOwner: true,
 cacheState: 'CREATED',
 rootpath: '/home/wisnuc/fruitmix/tmptest/drives/6586789e-4a2c-4159-b3da-903ae7f10c2a' } ],

**/

router.get('/', _auth2.default.jwt(), function (req, res) {

  var repo = _models2.default.getModel('repo');
  return res.status(200).json(repo.getDrives());
});

exports.default = router;