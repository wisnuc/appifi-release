'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reducers = require('./lib/reducers');

var _docker = require('./lib/docker');

var _docker2 = _interopRequireDefault(_docker);

var _appstore = require('./lib/appstore');

var _appstore2 = _interopRequireDefault(_appstore);

var _dockerStateObserver = require('./lib/dockerStateObserver');

var _dockerStateObserver2 = _interopRequireDefault(_dockerStateObserver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  console.log('[appifi] init');
  (0, _reducers.observeDocker)(_dockerStateObserver2.default);
  _docker2.default.init();
  _appstore2.default.reload();
};