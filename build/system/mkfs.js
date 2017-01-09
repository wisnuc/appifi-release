'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mkfsBtrfsAsync = exports.mkfsBtrfs = undefined;

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _storage = require('./storage');

var _adapter = require('./adapter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:mkfs');

var umount = function umount(mountpoint, callback) {
  return _child_process2.default.exec('umount ' + mountpoint, function (err) {
    return callback(err);
  });
};
var umountAsync = (0, _bluebird.promisify)(umount);

/**
 * unmount all blocks contained by target, target may be 
 * a volume device (disk), or standalone fs disk or partition.
 * eg. sdb, sdb1
 */
var umountBlocks = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(adapted, target) {
    var blocks, volumes, blks, uuids, mvols, mparts, mblks, i;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            debug('unmounte blocks, adapted, target', adapted, target);

            blocks = adapted.blocks, volumes = adapted.volumes;
            blks = target.map(function (name) {
              return blocks.find(function (blk) {
                return blk.name === name;
              });
            });

            // if it is volume device

            uuids = blks.filter(function (blk) {
              return blk.isMounted;
            }) // filter mounted
            .filter(function (blk) {
              return blk.isVolumeDevice;
            }) // filter volume devices
            .map(function (blk) {
              return blk.btrfsVolume;
            }); // map to uuid (may dup) TODO

            mvols = (0, _from2.default)(new _set2.default(uuids)).sort() // dedup
            .map(function (uuid) {
              return volumes.find(function (vol) {
                return (// map to volume
                  vol.uuid === uuid
                );
              });
            });

            // if it is partitioned disk (not necessarily mounted)

            mparts = blks.filter(function (blk) {
              return blk.isDisk && blk.isPartitioned;
            }).reduce(function (prev, curr) {
              return prev.concat(blocks.filter(function (blk) {
                return blk.parentName === curr.name;
              }));
            }, []).filter(function (blk) {
              return blk.isMounted;
            });

            // the left should be partition or disk with standalone fs

            mblks = blks.filter(function (blk) {
              return blk.isMounted;
            }) // filter mounted 
            .filter(function (blk) {
              return blk.isPartition || // is partition
              blk.isDisk && blk.isFileSystem && !blk.isVolumeDevice;
            }); // is non-volume filesystem disk

            // for mounted volumes, normal umount
            // for mounted blocks (with fs)
            //  umount usb by udisksctl
            //  umount non-usb by normal umount

            i = void 0;
            i = 0;

          case 9:
            if (!(i < mvols.length)) {
              _context.next = 16;
              break;
            }

            debug('un-mounting volume ' + mvols[i].uuid);
            _context.next = 13;
            return umountAsync(mvols[i].mountpoint);

          case 13:
            i++;
            _context.next = 9;
            break;

          case 16:
            i = 0;

          case 17:
            if (!(i < mparts.length)) {
              _context.next = 24;
              break;
            }

            debug('un-mounting partition ' + mparts[i].name);
            _context.next = 21;
            return umountAsync(mparts[i].mountpoint);

          case 21:
            i++;
            _context.next = 17;
            break;

          case 24:
            i = 0;

          case 25:
            if (!(i < mblks.length)) {
              _context.next = 32;
              break;
            }

            debug('un-mounting block ' + mblks[i].name);
            _context.next = 29;
            return umountAsync(mblks[i].mountpoint);

          case 29:
            i++;
            _context.next = 25;
            break;

          case 32:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function umountBlocks(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

/**
 * target: array of device name ['sda', 'sdb', etc]
 * mode: must be 'single', 'raid0', 'raid1'
 * init: may be removed in future
 */
var mkfsBtrfsAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(target, mode, init) {
    var error, storage, adapted, blocks, volumes, _loop, i, devnames, block, uuid, volume, mp;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            error = null;


            debug('mkfsBtrfs', target, mode);

            // validate mode

            if (!(['single', 'raid0', 'raid1'].indexOf(mode) === -1)) {
              _context2.next = 4;
              break;
            }

            throw new Error('invalid mode');

          case 4:
            if (!(!Array.isArray(target) || target.length === 0 || !target.every(function (name) {
              return typeof name === 'string';
            }))) {
              _context2.next = 6;
              break;
            }

            throw new Error('invalid target names');

          case 6:
            storage = void 0, adapted = void 0, blocks = void 0, volumes = void 0;


            target = (0, _from2.default)(new _set2.default(target)).sort();
            _context2.next = 10;
            return (0, _storage.refreshStorageAsync)();

          case 10:
            storage = _context2.sent;

            adapted = (0, _adapter.adaptStorage)(storage);

            _loop = function _loop(i) {
              var block = adapted.blocks.find(function (blk) {
                return blk.name === target[i];
              });
              if (!block) throw new Error('device ' + target[i] + ' not found');
              if (!block.isDisk) throw new Error('device ' + target[i] + ' is not a disk');
              if (block.unformattable) throw new Error('device ' + target[i] + ' is not formattable');
            };

            for (i = 0; i < target.length; i++) {
              _loop(i);
            }

            // dirty !!! FIXME
            devnames = target.map(function (name) {
              return '/dev/' + name;
            });

            debug('mkfs.btrfs ' + mode, devnames);

            _context2.prev = 16;
            _context2.next = 19;
            return umountBlocks(adapted, target);

          case 19:
            _context2.next = 21;
            return _child_process2.default.execAsync('mkfs.btrfs -d ' + mode + ' -f ' + devnames.join(' '));

          case 21:
            _context2.next = 23;
            return (0, _bluebird.delay)(1500);

          case 23:
            _context2.next = 25;
            return _child_process2.default.execAsync('partprobe');

          case 25:
            _context2.next = 32;
            break;

          case 27:
            _context2.prev = 27;
            _context2.t0 = _context2['catch'](16);
            _context2.next = 31;
            return (0, _storage.refreshStorageAsync)();

          case 31:
            throw _context2.t0;

          case 32:
            _context2.next = 34;
            return (0, _storage.refreshStorageAsync)();

          case 34:
            storage = _context2.sent;

            adapted = (0, _adapter.adaptStorage)(storage);

            blocks = adapted.blocks;
            volumes = adapted.volumes;

            debug('target[0]', target[0]);
            block = blocks.find(function (blk) {
              return blk.name === target[0];
            });


            debug('block', block);
            uuid = block.fileSystemUUID;


            debug('uuid', uuid);
            volume = volumes.find(function (vol) {
              return vol.uuid === uuid;
            });


            debug('volume');
            mp = volume.mountpoint;


            debug('mountpoint');

            console.log('[system] mkfs.btrfs success', volume);

            if (!init) {
              _context2.next = 52;
              break;
            }

            _context2.next = 51;
            return installFruitmixAsync(mp, init);

          case 51:
            debug('fruitmix installed');

          case 52:
            return _context2.abrupt('return', uuid);

          case 53:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[16, 27]]);
  }));

  return function mkfsBtrfsAsync(_x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

var mkfsBtrfs = function mkfsBtrfs(target, mode, init, callback) {

  if (typeof init === 'function') {
    callback = init;
    init = undefined;
  }

  mkfsBtrfsAsync(target, mode, init).asCallback(callback);
};

var mkfsExt4 = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(target, opts) {
    var err;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _storage.refreshStorageAsync)();

          case 2:
            // with decoration

            debug('mkfsExt4', target, opts);

            target = (0, _from2.default)(new _set2.default(target)).sort();

            err = validateExt4Candidates(target);

            if (!err) {
              _context3.next = 7;
              break;
            }

            throw err;

          case 7:
            _context3.next = 9;
            return umountBlocks(target);

          case 9:

            debug('mkfsExt4 success');

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function mkfsExt4(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

var mkfsNtfs = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(target, opts) {
    var err;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _storage.refreshStorageAsync)();

          case 2:

            debug('mkfsNtfs', target, opts);

            target = (0, _from2.default)(new _set2.default(target)).sort();
            err = validateOtherFSCandidates(target);

            if (!err) {
              _context4.next = 7;
              break;
            }

            throw err;

          case 7:
            _context4.next = 9;
            return umountBlocks(target);

          case 9:

            debug('mkfsNtfs success');

          case 10:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function mkfsNtfs(_x8, _x9) {
    return _ref4.apply(this, arguments);
  };
}();

exports.mkfsBtrfs = mkfsBtrfs;
exports.mkfsBtrfsAsync = mkfsBtrfsAsync;