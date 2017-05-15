'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _assets = require('../../assets');

var _assets2 = _interopRequireDefault(_assets);

var _server = require('./server');

var _server2 = _interopRequireDefault(_server);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use((0, _morgan2.default)('dev', { skip: function skip(req, res) {
    return res.nolog === true;
  } }));

app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));

app.set('json spaces', 2);

app.get('/', function (req, res) {
  return res.set('Content-Type', 'text/html').send(_assets2.default.indexHtml);
});

app.get('/favicon.ico', function (req, res) {
  return res.set('Content-Type', 'image/x-icon').send(_assets2.default.favicon);
});

app.get('/index.html', function (req, res) {
  return res.set('Content-Type', 'text/html').send(_assets2.default.indexHtml);
});

app.get('/bundle.js', function (req, res) {
  return res.set('Content-Type', 'application/javascript').send(_assets2.default.bundlejs);
});

app.get('/stylesheets/style.css', function (req, res) {
  return res.set('Content-Type', 'text/css').send(_assets2.default.styleCSS);
});

app.get('/stylesheets/roboto.css', function (req, res) {
  return res.set('Content-Type', 'text/css').send(_assets2.default.robotoCSS);
});

app.get('/stylesheets/Roboto-Thin-webfont.woff', function (req, res) {
  return res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoThin);
});

app.get('/stylesheets/Roboto-Light-webfont.woff', function (req, res) {
  return res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoLight);
});

app.get('/stylesheets/Roboto-Regular-webfont.woff', function (req, res) {
  return res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoRegular);
});

app.get('/stylesheets/Roboto-Medium-webfont.woff', function (req, res) {
  return res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoMedium);
});

app.get('/stylesheets/Roboto-Bold-webfont.woff', function (req, res) {
  return res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoBold);
});

app.get('/stylesheets/Roboto-Black-webfont.woff', function (req, res) {
  return res.set('Content-Type', 'application/font-woff').send(_assets2.default.robotoBlack);
});

var nolog = function nolog(res) {
  res.nolog = true;
  return res;
};

app.get('/server', function (req, res) {
  return nolog(res).status(200).json(_server2.default.get());
});
app.get('/server/status', function (req, res) {
  return nolog(res).status(200).json(_server2.default.status());
});

app.post('/server', function (req, res) {
  return _server2.default.operation(req.body, function (err, result) {
    return err ? res.status(200).json({
      err: err.message,
      ecode: err.code
    }) : res.status(200).json({
      err: null,
      result: result
    });
  });
});

module.exports = app;