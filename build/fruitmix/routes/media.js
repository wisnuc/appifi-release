'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _express = require('express');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

// return meta data of all I can view
router.get('/', _auth2.default.jwt(), function (req, res) {
  try {
    var filer = _models2.default.getModel('filer');
    var media = _models2.default.getModel('media');
    var user = req.user;

    // metamap
    var mediaMetaMap = filer.initMediaMap(user.uuid);
    media.fillMediaMetaMap(mediaMetaMap, user.uuid, filer);
    res.status(200).json((0, _from2.default)(mediaMetaMap.values()));
  } catch (e) {
    console.log(e);
    res.status(500).end();
  }
});

router.get('/:digest/download', _auth2.default.jwt(), function (req, res) {

  var filer = _models2.default.getModel('filer');
  var user = req.user;
  var digest = req.params.digest;

  var filepath = filer.readMedia(user.uuid, digest);

  if (!filepath) return res.status(404).json({});

  res.status(200).sendFile(filepath);
});

/**
  use query string, possible options:

  width: 'integer',
  height: 'integer'
  modifier: 'caret',      // optional
  autoOrient: 'true',     // optional
  instant: 'true'         // optional

  width and height, provide at least one
  modifier effectvie only if both width and height provided
**/

router.get('/:digest/thumbnail', function (req, res) {

  var user = req.user;
  var digest = req.params.digest;
  var query = req.query;

  var thumbnailer = _models2.default.getModel('thumbnailer');
  thumbnailer.request(digest, query, function (err, ret) {

    if (err) return res.status(500).json(err);

    if ((typeof ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(ret)) === 'object') {
      res.status(202).json(ret);
    } else {
      res.status(200).sendFile(ret);
    }
  });
});

exports.default = router;