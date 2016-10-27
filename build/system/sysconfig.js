'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:config');

var K = function K(x) {
  return function (y) {
    return x;
  };
};

var configFilePath = '/etc/wisnuc.json';

var config = {};

var validateVersion = function validateVersion(ver) {
  return ver === 1 ? 1 : undefined;
};

var validateLastUsedVolume = function validateLastUsedVolume(luv) {
  return luv === null || typeof luv === 'string' && _validator2.default.isUUID(luv) ? luv : undefined;
};

var validateLastFileSystem = function validateLastFileSystem(lfs) {
  if (lfs === null) return lfs;
  if (lfs instanceof Object && (lfs.type === 'btrfs' || lfs.type === 'ext4' || lfs.type === 'ntfs') && typeof lfs.uuid === 'string' && _validator2.default.isUUID(lfs.uuid)) return lfs;
};

var validateBootMode = function validateBootMode(bm) {
  return bm === 'normal' || bm === 'maintenance' ? bm : undefined;
};

var validateBarcelonaFanScale = function validateBarcelonaFanScale(scale) {
  return (0, _isInteger2.default)(scale) && scale >= 0 && scale <= 100 ? scale : undefined;
};

var validateIpAliasing = function validateIpAliasing(ipAliasing) {
  return Array.isArray(ipAliasing) ? ipAliasing.filter(function (ent) {
    return typeof ent.mac === 'string' && _validator2.default.isMACAddress(ent.mac) && typeof ent.ipv4 === 'string' && _validator2.default.isIP(ent.ipv4, 4);
  }) : undefined;
};

var writeConfig = function writeConfig() {
  var text = (0, _stringify2.default)(config, null, '  ');
  _fs2.default.writeFile(configFilePath, text, function (err) {
    debug('sysconfig written', config);
  });
};

var initialize = function initialize() {

  var writeback = false;
  var parsed = void 0;

  var load = function load(prop, validate, def) {

    var valid = validate(parsed[prop]);
    if (valid !== undefined) config[prop] = valid;else config[prop] = K(def)(writeback = true);
  };

  try {

    // read config file
    var read = _fs2.default.readFileSync(configFilePath, { encoding: 'utf8' });
    parsed = JSON.parse(read.toString());

    if (parsed.constructor !== Object) throw 'not an object';

    load('version', validateVersion, 1);
    load('lastUsedVolume', validateLastUsedVolume, null);
    load('lastFileSystem', validateLastFileSystem, null);
    load('bootMode', validateBootMode, 'normal');
    load('barcelonaFanScale', validateBarcelonaFanScale, 50);
    load('ipAliasing', validateIpAliasing, []);
  } catch (e) {

    console.log(e);
    config = {
      version: 1,
      lastUsedVolume: null,
      lastFileSystem: null,
      bootMode: 'normal',
      barcelonaFanScale: 50,
      ipAliasing: []
    };

    writeback = true;
  }

  writeback && writeConfig();

  console.log('[sysconfig] initialized', config);
};

initialize();

exports.default = {

  get: function get(key) {
    return config[key];
  },
  set: function set(key, val) {

    if (key === 'barcelonaFanScale' && validateBarcelonaFanScale(val) || key === 'lastUsedVolume' && validateLastUsedVolume(val) || key === 'lastFileSystem' && validateLastFileSystem(val) || key === 'bootMode' && validateBootMode(val) || key === 'ipAliasing' && validateIpAliasing(val)) {

      config[key] = val;
      writeConfig();
    }
  }
};