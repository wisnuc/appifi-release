'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _assets = require('../../assets');

var _assets2 = _interopRequireDefault(_assets);

var _server = require('./routes/server');

var _server2 = _interopRequireDefault(_server);

var _appstore = require('./routes/appstore');

var _appstore2 = _interopRequireDefault(_appstore);

var _stylesheets = require('./routes/stylesheets');

var _stylesheets2 = _interopRequireDefault(_stylesheets);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

app.use((0, _morgan2.default)('dev', {
  skip: function skip(req, res) {
    return res.nolog === true;
  }
}));

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

app.use('/stylesheets', _stylesheets2.default);
app.use('/appstore', _appstore2.default);
app.use('/server', _server2.default);

exports.default = app;