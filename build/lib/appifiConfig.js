'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getConfig = exports.setConfig = exports.initConfig = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var configFilePath = '/etc/wisnuc.json';

// log
var info = function info(text) {
  return console.log('[appifi config] ' + text);
};

// global
var config = {};

var writeConfig = function writeConfig() {
  return _fs2.default.writeFile(configFilePath, (0, _stringify2.default)(config, null, ' '), function (err) {});
};

var getConfig = function getConfig(name) {
  return config[name];
};

var setConfig = function setConfig(name, value) {

  if (!config.hasOwnProperty(name)) return;
  if (config[name] === value) return;

  config[name] = value;
  writeConfig();
};

var initConfig = function initConfig() {

  var x = void 0,
      y = void 0,
      writeback = false;

  // read config file
  try {
    x = _fs2.default.readFileSync(configFilePath, { encoding: 'utf8' });
    x = JSON.parse(x.toString());

    y = x.version;
    if (y === 1) config.version = 1;else {
      config.version = 1;
      writeback = true;
    }

    y = x.lastUsedVolume;
    if (y === null || typeof y === 'string' && _validator2.default.isUUID(y)) config.lastUsedVolume = y;else {
      config.lastUsedVolume = null;
      writeback = true;
    }

    y = x.barcelonaFanScale;
    if (y && typeof y === 'number' && y >= 0 && y <= 100) config.barcelonaFanScale = y;else {
      config.barcelonaFanScale = 50;
      writeback = true;
    }

    info('config initialized');
  } catch (e) {
    console.log(e);
    info('config file not found or io error, use default');
    config = {
      version: 1,
      lastUsedVolume: null,
      barcelonaFanScale: 50
    };
    writeback = true;
  }

  if (writeback) writeConfig();
  console.log(config);
};

exports.initConfig = initConfig;
exports.setConfig = setConfig;
exports.getConfig = getConfig;