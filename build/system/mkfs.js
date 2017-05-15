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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var child = require('child_process');
var debug = require('debug')('system:mkfs');
var Storage = require('./storage');

var umount = function umount(mountpoint, callback) {
  return child.exec('umount ' + mountpoint, function (err) {
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
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(storage, target) {
    var blocks, volumes, blks, uuids, mvols, mparts, mblks, i;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            debug('unmount blocks, storage, target', storage, target);

            blocks = storage.blocks, volumes = storage.volumes;
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
            return (0, _bluebird.resolve)(umountAsync(mvols[i].mountpoint));

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
            return (0, _bluebird.resolve)(umountAsync(mparts[i].mountpoint));

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
            return (0, _bluebird.resolve)(umountAsync(mblks[i].mountpoint));

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
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(args) {
    var error, target, mode, storage, blocks, volumes, _loop, i, devnames, block, uuid, volume;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            error = null;
            target = args.target, mode = args.mode;


            debug('mkfsBtrfs', target, mode);

            // validate mode

            if (!(['single', 'raid0', 'raid1'].indexOf(mode) === -1)) {
              _context2.next = 5;
              break;
            }

            throw new Error('invalid mode: ' + mode);

          case 5:
            if (!(!Array.isArray(target) || target.length === 0 || !target.every(function (name) {
              return typeof name === 'string';
            }))) {
              _context2.next = 7;
              break;
            }

            throw new Error('invalid target names');

          case 7:
            storage = void 0, blocks = void 0, volumes = void 0;


            target = (0, _from2.default)(new _set2.default(target)).sort();
            _context2.next = 11;
            return (0, _bluebird.resolve)(Storage.refreshAsync());

          case 11:
            storage = _context2.sent;

            _loop = function _loop(i) {
              var block = storage.blocks.find(function (blk) {
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
            return (0, _bluebird.resolve)(umountBlocks(storage, target));

          case 19:
            _context2.next = 21;
            return (0, _bluebird.resolve)(child.execAsync('mkfs.btrfs -d ' + mode + ' -f ' + devnames.join(' ')));

          case 21:
            _context2.next = 23;
            return (0, _bluebird.resolve)((0, _bluebird.delay)(1500));

          case 23:
            _context2.next = 25;
            return (0, _bluebird.resolve)(child.execAsync('partprobe'));

          case 25:
            _context2.next = 30;
            break;

          case 27:
            _context2.prev = 27;
            _context2.t0 = _context2['catch'](16);
            throw _context2.t0;

          case 30:
            _context2.prev = 30;
            _context2.next = 33;
            return (0, _bluebird.resolve)(Storage.refreshAsync());

          case 33:
            storage = _context2.sent;
            return _context2.finish(30);

          case 35:

            blocks = storage.blocks;
            volumes = storage.volumes;

            block = blocks.find(function (blk) {
              return blk.name === target[0];
            });
            uuid = block.fileSystemUUID;
            volume = volumes.find(function (vol) {
              return vol.uuid === uuid;
            });
            return _context2.abrupt('return', uuid);

          case 41:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[16, 27, 30, 35]]);
  }));

  return function mkfsBtrfsAsync(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var mkfsBtrfs = function mkfsBtrfs(args, callback) {
  return mkfsBtrfsAsync(args).asCallback(function (err, result) {
    if (err) console.log('[system] mkfs error', err);else console.log('[system] mkfs success, volume uuid: ' + result);

    callback(err, result);
  });
};

/**

const mkfsExt4 = async (target, opts) => {

  await refreshStorageAsync() // with decoration

  debug('mkfsExt4', target, opts)

  target = Array.from(new Set(target)).sort()

  let err = validateExt4Candidates(target)
  if (err) throw err

  await umountBlocks(target)

  debug('mkfsExt4 success')
}

const mkfsNtfs = async (target, opts) => {

  await refreshStorageAsync() 
  
  debug('mkfsNtfs', target, opts)

  target = Array.from(new Set(target)).sort()
  let err = validateOtherFSCandidates(target)
  if (err) throw err

  await umountBlocks(target)
  
  debug('mkfsNtfs success')
}

**/

exports.mkfsBtrfs = mkfsBtrfs;
exports.mkfsBtrfsAsync = mkfsBtrfsAsync;