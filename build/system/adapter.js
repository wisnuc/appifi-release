'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.probeAllFruitmixesAsync = exports.probeAllFruitmixes = exports.probeFruitmix = exports.initFruitmix = exports.adaptStorage = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _tools = require('../fruitmix/tools');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:adapter');

//
// input: storage, stated
// output: { port, blocks, volumes }
//
var adaptStorage = function adaptStorage(storage) {

  // adapt ports
  var ports = storage.ports.map(function (port) {
    return {
      path: port.path,
      subsystem: port.props.subsystem
    };
  });

  // add name, devname, path, removable and size, merged into stats
  var blocks = void 0;
  blocks = storage.blocks.map(function (blk) {
    return (0, _assign2.default)({
      name: blk.name,
      devname: blk.props.devname,
      path: blk.path,
      removable: blk.sysfsProps[0].attrs.removable === "1",
      size: parseInt(blk.sysfsProps[0].attrs.size)
    }, blk.stats);
  });

  // process volumes
  var volumes = storage.volumes.map(function (vol) {

    // find usage for this volume
    var usage = storage.usages.find(function (usg) {
      return usg.mountpoint === vol.stats.mountpoint;
    });

    // copy level 1 props
    var copy = {
      overall: usage.overall,
      system: usage.system,
      metadata: usage.metadata,
      data: usage.data,
      unallocated: usage.unallocated
    };

    // copy volume object, merge stats and usage
    var mapped = (0, _assign2.default)({}, vol, vol.stats, { usage: copy });
    delete mapped.stats;

    // copy level 2 (usage for each volume device) into devices
    mapped.devices = vol.devices.map(function (dev) {
      var devUsage = usage.devices.find(function (ud) {
        return ud.name === dev.path;
      });
      return {
        name: _path2.default.basename(dev.path), // tricky
        path: dev.path,
        id: dev.id,
        used: dev.used,
        size: devUsage.size,
        unallocated: devUsage.unallocated,
        system: devUsage.system,
        metadata: devUsage.metadata,
        data: devUsage.data
      };
    });

    return mapped;
  });

  return { ports: ports, blocks: blocks, volumes: volumes };
};

var probeFruitmixAsync = (0, _bluebird.promisify)(_tools.probeFruitmix);

var probeAllFruitmixesAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(storage) {
    var mps, copy;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            mps = [];
            copy = (0, _clone2.default)(storage);


            copy.volumes.forEach(function (vol) {
              if (vol.isMounted && !vol.isMissing) mps.push({
                ref: vol,
                mp: vol.mountpoint
              });
            });

            // only ext4 probed
            copy.blocks.forEach(function (blk) {
              if (!blk.isVolumeDevice && blk.isMounted && blk.isExt4) mps.push({
                ref: blk,
                mp: blk.mountpoint
              });
            });

            debug('probe all, mps', mps);

            _context.next = 7;
            return (0, _bluebird.map)(mps, function (obj) {
              return probeFruitmixAsync(obj.mp).reflect();
            }).each(function (inspection, index) {
              if (inspection.isFulfilled()) mps[index].ref.wisnuc = inspection.value();else {
                debug('probe fruitmix failed', inspection.reason());
                mps[index].ref.wisnuc = 'ERROR';
              }
            });

          case 7:

            debug('copy', copy);
            return _context.abrupt('return', copy);

          case 9:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function probeAllFruitmixesAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

var probeAllFruitmixes = function probeAllFruitmixes(storage, callback) {
  return probeAllFruitmixesAsync(storage).asCallback(callback);
};

exports.adaptStorage = adaptStorage;
exports.initFruitmix = _tools.initFruitmix;
exports.probeFruitmix = _tools.probeFruitmix;
exports.probeAllFruitmixes = probeAllFruitmixes;
exports.probeAllFruitmixesAsync = probeAllFruitmixesAsync;