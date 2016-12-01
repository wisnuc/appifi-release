'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('reducers:config');
var K = function K(x) {
  return function (y) {
    return x;
  };
};

// 
// all validators returns original object/value if valid, 
// returns undefined if invalid 
//

// version validator
var validateVersion = function validateVersion(ver) {
  return ver === 1 ? 1 : undefined;
};

// dockerInstall, 'rootfs' or 'fruitmix'
var validateDockerInstall = function validateDockerInstall(di) {

  if (di === null) return di;
  if (di instanceof Object) {
    if (di.type === 'fruitmix') return di;
    if (di.type === 'roofs') return di;
  }
};

// lastFileSystem validator
var validateLastFileSystem = function validateLastFileSystem(lfs) {
  if (lfs === null) return lfs;
  if (lfs instanceof Object && (lfs.type === 'btrfs' || lfs.type === 'ext4' || lfs.type === 'ntfs') && typeof lfs.uuid === 'string' && _validator2.default.isUUID(lfs.uuid)) return lfs;
};

// bootMode validator
var validateBootMode = function validateBootMode(bm) {
  return bm === 'normal' || bm === 'maintenance' ? bm : undefined;
};

// barcelona fanscale 
var validateBarcelonaFanScale = function validateBarcelonaFanScale(scale) {
  return (0, _isInteger2.default)(scale) && scale >= 0 && scale <= 100 ? scale : undefined;
};

// ip aliasing
var validateIpAliasing = function validateIpAliasing(ipAliasing) {
  return Array.isArray(ipAliasing) ? ipAliasing.filter(function (ent) {
    return typeof ent.mac === 'string' && _validator2.default.isMACAddress(ent.mac) && typeof ent.ipv4 === 'string' && _validator2.default.isIP(ent.ipv4, 4);
  }) : undefined;
};

//
// end of validators
//


// input: a parsed config
// output: if changed, new config object
var initConfig = function initConfig(raw) {

  var parsed = void 0,
      config = {};
  var load = function load(prop, validate, def) {

    var valid = validate(parsed[prop]);
    if (valid !== undefined) config[prop] = valid;else config[prop] = def;
  };

  try {
    parsed = JSON.parse(raw.toString());
    if (parsed.constructor !== Object) throw 'not an object';

    load('version', validateVersion, 1);
    //    load('lastUsedVolume', validateLastUsedVolume, null)
    load('dockerInstall', validateDockerInstall, null);
    load('lastFileSystem', validateLastFileSystem, null);
    load('bootMode', validateBootMode, 'normal');
    load('barcelonaFanScale', validateBarcelonaFanScale, 50);
    load('ipAliasing', validateIpAliasing, []);
  } catch (e) {

    console.log(e);
    config = {
      version: 1,
      lastUsedVolume: null,
      dockerInstall: null,
      lastFileSystem: null,
      bootMode: 'normal',
      barcelonaFanScale: 50,
      ipAliasing: []
    };
  }

  return config;
};

var config = function config() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'CONFIG_INIT':
      return initConfig(action.data);

    case 'CONFIG_BARCELONA_FANSCALE':
      return validateBarcelonaFanScale(action.data) ? (0, _assign2.default)({}, state, { barcelonaFanScale: action.data }) : state;

    case 'CONFIG_DOCKER_INSTALL':
      return validateDockerInstall(action.data) ? (0, _assign2.default)({}, state, { dockerInstall: action.data }) : state;

    case 'CONFIG_LAST_FILESYSTEM':
      return validateLastFileSystem(action.data) ? (0, _assign2.default)({}, state, { lastFileSystem: action.data }) : state;

    case 'CONFIG_BOOT_MODE':
      return validateBootMode(action.data) ? (0, _assign2.default)({}, state, { bootMode: action.data }) : state;

    case 'CONFIG_IP_ALIASING':
      return validateIpAliasing(action.data) ? (0, _assign2.default)({}, state, { ipAliasing: action.data }) : state;

    default:
      return state;
  }
};

exports.default = config;