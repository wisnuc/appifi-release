'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _assets = require('../../../assets');

var _assets2 = _interopRequireDefault(_assets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = _express2.default.Router();

router.get('/style.css', function (req, res) {
  res.set('Content-Type', 'text/css').send(_assets2.default.styleCSS);
});

router.get('/roboto.css', function (req, res) {
  res.set('Content-Type', 'text/css').send(_assets2.default.robotoCSS);
});

router.get('/Roboto-Thin-webfont.woff', function (req, res) {
  res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoThin);
});

router.get('/Roboto-Light-webfont.woff', function (req, res) {
  res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoLight);
});

router.get('/Roboto-Regular-webfont.woff', function (req, res) {
  res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoRegular);
});

router.get('/Roboto-Medium-webfont.woff', function (req, res) {
  res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoMedium);
});

router.get('/Roboto-Bold-webfont.woff', function (req, res) {
  res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoBold);
});

router.get('/Roboto-Black-webfont.woff', function (req, res) {
  res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoBlack);
});

module.exports = router;