'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _isInteger = require('babel-runtime/core-js/number/is-integer');

var _isInteger2 = _interopRequireDefault(_isInteger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = (0, _bluebird.promisifyAll)(require('fs'));
var validator = require('validator');
var deepEqual = require('deep-equal');
var deepFreeze = require('deep-freeze');
var createPersistenceAsync = require('../common/persistence');

/*******************************************************************************

Example wisnuc.json file

{
  "version": 1,
  "dockerInstall": null,
  "lastFileSystem": {
    "type": "btrfs",
    "uuid": "09f8a66c-0fac-4096-8274-7fcf33a6b87c"
  },
  "bootMode": "normal",
  "barcelonaFanScale": 65,
  "ipAliasing": [{ "mac": "xxxx", "ipv4": "xxxx"}]
}

*******************************************************************************/

var defaultConfig = {
  version: 1,
  dockerInstall: null,
  lastFileSystem: null,
  bootMode: 'normal',
  barcelonaFanScale: 50,
  ipAliasing: []
};

var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' && validator.isUUID(uuid);
};

var isValidLastFileSystem = function isValidLastFileSystem(lfs) {
  return lfs === null || lfs.type === 'btrfs' && isUUID(lfs.uuid);
};
var isValidBootMode = function isValidBootMode(bm) {
  return bm === 'normal' || bm === 'maintenance';
};
var isValidBarcelonaFanScale = function isValidBarcelonaFanScale(bfs) {
  return (0, _isInteger2.default)(bfs) && bfs >= 0 && bfs <= 100;
};
var isValidIpAliasing = function isValidIpAliasing(arr) {
  return arr.every(function (ia) {
    return typeof ia.mac === 'string' && validator.isMACAddress(ia.mac) && typeof ia.ipv4 === 'string' && validator.isIP(ia.ipv4, 4);
  });
};

/**
 * pseudo class singleton
 */
module.exports = {

  // cannot be written as async initAsync(...) 
  initAsync: function () {
    var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(fpath, tmpdir) {
      var read, dirty;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              read = void 0, dirty = false;


              this.config = (0, _assign2.default)({}, defaultConfig);
              _context.next = 4;
              return (0, _bluebird.resolve)(createPersistenceAsync(fpath, tmpdir, 500));

            case 4:
              this.persistence = _context.sent;
              _context.prev = 5;
              _context.t0 = JSON;
              _context.next = 9;
              return (0, _bluebird.resolve)(fs.readFileAsync(fpath));

            case 9:
              _context.t1 = _context.sent;
              read = _context.t0.parse.call(_context.t0, _context.t1);
              _context.next = 15;
              break;

            case 13:
              _context.prev = 13;
              _context.t2 = _context['catch'](5);

            case 15:

              if (!read) {
                dirty = true;
              } else {

                if (isValidLastFileSystem(read.lastFileSystem)) (0, _assign2.default)(this.config, { lastFileSystem: read.lastFileSystem });

                if (isValidBootMode(read.bootMode)) (0, _assign2.default)(this.config, { bootMode: read.bootMode });

                if (isValidBarcelonaFanScale(read.barcelonaFanScale)) (0, _assign2.default)(this.config, { barcelonaFanScale: read.barcelonaFanScale });

                if (isValidIpAliasing(read.ipAliasing)) (0, _assign2.default)(this.config, { ipAliasing: read.ipAliasing });

                if (!deepEqual(this.config, read)) dirty = true;
              }

              deepFreeze(this.config);
              if (dirty) this.persistence.save(this.config);

              console.log('[system] config loaded', this.config);

            case 19:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, this, [[5, 13]]);
    }));

    function initAsync(_x, _x2) {
      return _ref.apply(this, arguments);
    }

    return initAsync;
  }(),

  merge: function merge(props) {

    this.config = (0, _assign2.default)({}, this.config, props);
    deepFreeze(this.config);

    this.persistence.save(this.config);
  },
  updateLastFileSystem: function updateLastFileSystem(lfs, forceNormal) {

    if (!isValidLastFileSystem(lfs)) return;
    if (forceNormal !== undefined && typeof forceNormal !== 'boolean') return;
    var lastFileSystem = { type: 'btrfs', uuid: lfs.uuid };
    if (forceNormal) this.merge({ lastFileSystem: lastFileSystem, bootMode: 'normal' });else this.merge({ lastFileSystem: lastFileSystem });
  },
  updateBootMode: function updateBootMode(bm) {
    isValidBootMode(bm) && this.merge({ bootMode: bm });
  },
  updateBarcelonaFanScale: function updateBarcelonaFanScale(bfs) {
    isValidBarcelonaFanScale(bfs) && this.merge({ barcelonaFanScale: bfs });
  },
  updateIpAliasing: function updateIpAliasing(arr) {
    isValidIpAliasing(arr) && this.merge({ ipAliasing: arr });
  },
  get: function get() {
    return this.config;
  }
};