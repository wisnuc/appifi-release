'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _async = require('../common/async');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _deepFreeze = require('deep-freeze');

var _deepFreeze2 = _interopRequireDefault(_deepFreeze);

var _udevInfoAsync = require('./storage/udevInfoAsync');

var _udevInfoAsync2 = _interopRequireDefault(_udevInfoAsync);

var _procMountsAsync = require('./storage/procMountsAsync');

var _procMountsAsync2 = _interopRequireDefault(_procMountsAsync);

var _procSwapsAsync = require('./storage/procSwapsAsync');

var _procSwapsAsync2 = _interopRequireDefault(_procSwapsAsync);

var _btrfsfishowAsync = require('./storage/btrfsfishowAsync');

var _btrfsfishowAsync2 = _interopRequireDefault(_btrfsfishowAsync);

var _btrfsusageAsync = require('./storage/btrfsusageAsync');

var _btrfsusageAsync2 = _interopRequireDefault(_btrfsusageAsync);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');

var createPersistenceAsync = require('../common/persistence');

var debug = require('debug')('system:storage');

var volumeMountpoint = function volumeMountpoint(vol) {
  return '/run/wisnuc/volumes/' + vol.uuid;
};
var blockMountpoint = function blockMountpoint(blk) {
  return '/run/wisnuc/blocks/' + blk.name;
};

// probe ports
var probePorts = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.t0 = _udevInfoAsync2.default;
            _context.next = 3;
            return (0, _bluebird.resolve)(_async.child.execAsync('find /sys/class/ata_port -type l'));

          case 3:
            _context.t1 = function (l) {
              return l.trim();
            };

            _context.t2 = function (l) {
              return l.length;
            };

            _context.t3 = _context.sent.toString().split('\n').map(_context.t1).filter(_context.t2);
            return _context.abrupt('return', (0, _context.t0)(_context.t3));

          case 7:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function probePorts() {
    return _ref.apply(this, arguments);
  };
}();

// probe blocks
var probeBlocks = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.t0 = _udevInfoAsync2.default;
            _context2.next = 3;
            return (0, _bluebird.resolve)(_async.child.execAsync('find /sys/class/block -type l'));

          case 3:
            _context2.t1 = function (l) {
              return l.trim();
            };

            _context2.t2 = function (l) {
              return l.length;
            };

            _context2.t3 = function (l) {
              return l.startsWith('/sys/class/block/sd');
            };

            _context2.t4 = _context2.sent.toString().split('\n').map(_context2.t1).filter(_context2.t2).filter(_context2.t3);
            return _context2.abrupt('return', (0, _context2.t0)(_context2.t4));

          case 8:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function probeBlocks() {
    return _ref2.apply(this, arguments);
  };
}();

// probe ports, blocks, volumes, mounts, and swaps
var probeStorage = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var result, storage;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _bluebird.resolve)((0, _bluebird.all)([probePorts(), probeBlocks(), (0, _btrfsfishowAsync2.default)(), (0, _procMountsAsync2.default)(), (0, _procSwapsAsync2.default)()]));

          case 2:
            result = _context3.sent;
            storage = {
              ports: result[0],
              blocks: result[1],
              volumes: result[2],
              mounts: result[3],
              swaps: result[4]
            };


            debug('probe storage without usages', storage);
            return _context3.abrupt('return', storage);

          case 6:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function probeStorage() {
    return _ref3.apply(this, arguments);
  };
}();

/**
 * Find out the mount for given volume, return mount object or undefined
 */
var volumeMount = function volumeMount(volume, mounts) {
  return mounts.find(function (mnt) {
    return volume.devices.find(function (dev) {
      return dev.path === mnt.device;
    });
  });
};

/**
 * Find out the volume the given block device belongs to, return volume or undefined
 */
var blockVolume = function blockVolume(block, volumes) {
  return volumes.find(function (vol) {
    return vol.devices.find(function (dev) {
      return dev.path === block.props.devname;
    });
  });
};

/**
 * a callback for two mount functions
 */
var stampMountError = function stampMountError(inspection, item) {
  if (inspection.isFulfilled()) item.mountError = null;else if (inspection.isRejected()) {
    console.log('[storage] failed to mount volume or block: ', item);
    item.mountError = inspection.reason().message;
  } else {
    console.log('[storage] unexpected inspection which is neither fulfilled or rejected for volume or block: ', item);
    item.mountError = 'neither fulfilled nor rejected';
  }
};

/**
 * mount single volume, with opts
 */
var mountVolumeAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(uuid, mountpoint, opts) {
    var cmd;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(mountpoint));

          case 2:
            cmd = opts ? 'mount -t btrfs -o ' + opts + ' UUID=' + uuid + ' ' + mountpoint : 'mount -t btrfs UUID=' + uuid + ' ' + mountpoint;
            _context4.next = 5;
            return (0, _bluebird.resolve)(_async.child.execAsync(cmd));

          case 5:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined);
  }));

  return function mountVolumeAsync(_x, _x2, _x3) {
    return _ref4.apply(this, arguments);
  };
}();

/**
 * try to mount all volumes not mounted yet
 */
var mountVolumesAsync = function () {
  var _ref5 = (0, _bluebird.method)(function (volumes, mounts) {

    var unmounted = volumes.filter(function (vol) {
      return volumeMount(vol, mounts) === undefined;
    });

    console.log('[storage] mounting volumes', unmounted);

    return (0, _bluebird.map)(unmounted, function (vol) {
      return mountVolumeAsync(vol.uuid, volumeMountpoint(vol), vol.missing ? 'degraded,ro' : null).reflect();
    }).each(function (inspection, index) {
      stampMountError(inspection, unmounted[index]);
    });
  });

  return function mountVolumesAsync(_x4, _x5) {
    return _ref5.apply(this, arguments);
  };
}();

/**
 * try to mount all blocks with supported file systems that not mounted yet
 */
var mountNonVolumesAsync = function () {
  var _ref6 = (0, _bluebird.method)(function (blocks, mounts) {

    var mountNonUSB = function () {
      var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(blk) {
        var dir;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                dir = blockMountpoint(blk);
                _context5.next = 3;
                return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(dir));

              case 3:
                _context5.next = 5;
                return (0, _bluebird.resolve)(_async.child.execAsync('mount ' + blk.props.devname + ' ' + dir));

              case 5:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, undefined);
      }));

      return function mountNonUSB(_x8) {
        return _ref7.apply(this, arguments);
      };
    }();

    // only for known file system type on standalone disk or partition, whitelist policy
    var unmounted = blocks.filter(function (blk) {

      // if blk is disk
      //   blk is fs (and no partition table) && fs type is (ext4 or ntfs or vfat) && blk is not mounted
      // if block is partition
      //   blk is fs && fs type is (ext4 or ntfs or vfat) && blk is not mounted
      if (blk.props.devtype === 'disk' && !blk.props.id_part_table_type || blk.props.devtype === 'partition') {
        if (blk.props.id_fs_usage === 'filesystem' && ['ext4', 'ntfs', 'vfat'].indexOf(blk.props.id_fs_type) !== -1 && !mounts.find(function (mnt) {
          return mnt.device === blk.props.devname;
        })) {
          return true;
        }
      }
    });

    console.log('[storage] mounting blocks', unmounted);

    return (0, _bluebird.map)(unmounted, function (blk) {
      if (blk.props.id_bus === 'usb') return _async.child.execAsync('udisksctl mount --block-device ' + blk.props.devname + ' --no-user-interaction').reflect();else return mountNonUSB(blk).reflect();
    }).each(function (inspection, index) {
      stampMountError(inspection, unmounted[index]);
    });
  });

  return function mountNonVolumesAsync(_x6, _x7) {
    return _ref6.apply(this, arguments);
  };
}();

/**
 * probe btrfs volume usages
 */
var probeUsages = function () {
  var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(mounts) {
    var filtered;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            filtered = mounts.filter(function (mnt) {
              return mnt.fs_type === 'btrfs' && mnt.mountpoint.startsWith('/run/wisnuc/volumes/') && !mnt.mountpoint.endsWith('/graph/btrfs');
            });
            _context6.next = 3;
            return (0, _bluebird.resolve)((0, _bluebird.all)(filtered.map(function (mnt) {
              return (0, _btrfsusageAsync2.default)(mnt.mountpoint);
            })));

          case 3:
            return _context6.abrupt('return', _context6.sent);

          case 4:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, undefined);
  }));

  return function probeUsages(_x9) {
    return _ref8.apply(this, arguments);
  };
}();

/**
 * probe (expect usages), mount, reprobe mount, then probe usages, all result merged
 */
var probeStorageWithUsages = function () {
  var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7() {
    var storage, mounts, usages;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return (0, _bluebird.resolve)(probeStorage());

          case 2:
            storage = _context7.sent;
            _context7.next = 5;
            return (0, _bluebird.resolve)(mountVolumesAsync(storage.volumes, storage.mounts));

          case 5:
            _context7.next = 7;
            return (0, _bluebird.resolve)(mountNonVolumesAsync(storage.blocks, storage.mounts));

          case 7:
            _context7.next = 9;
            return (0, _bluebird.resolve)((0, _procMountsAsync2.default)());

          case 9:
            mounts = _context7.sent;
            _context7.next = 12;
            return (0, _bluebird.resolve)((0, _bluebird.delay)(100));

          case 12:
            _context7.next = 14;
            return (0, _bluebird.resolve)(probeUsages(mounts));

          case 14:
            usages = _context7.sent;
            return _context7.abrupt('return', (0, _assign2.default)({}, storage, { mounts: mounts, usages: usages }));

          case 16:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, undefined);
  }));

  return function probeStorageWithUsages() {
    return _ref9.apply(this, arguments);
  };
}();

// a block obj may be:
// 
// 1 isDisk
//   1.1 isFileSystem
//     1.1.1 isBtrfsDevice
//   1.2 isPartitioned
//     partitionTableType
// 2 isPartition
//   2.1 isExtended
//     2.1.1 (isExtended=false) fileSystemType 
//   2.2 parent
// 3 isMounted
// 4 isRootFS (for partition, is rootfs partition, for disk && btrfs device, is rootfs volume)
// 5 isSwap 

var statFsUsageDefined = function statFsUsageDefined(blk) {

  blk.stats.fsUsageDefined = true;
  blk.stats.idFsUsage = blk.props.id_fs_usage;
  blk.stats.fileSystemType = blk.props.id_fs_type;
  blk.stats.fileSystemUUID = blk.props.id_fs_uuid;

  if (blk.props.id_fs_usage === 'filesystem') {
    // used as file system

    blk.stats.isFileSystem = true;
    switch (blk.props.id_fs_type) {
      case 'btrfs':
        blk.stats.isVolumeDevice = true;
        blk.stats.isBtrfs = true;
        blk.stats.btrfsVolume = blk.props.id_fs_uuid;
        blk.stats.btrfsDevice = blk.props.id_fs_uuid_sub;
        break;
      case 'ext4':
        blk.stats.isExt4 = true;
        break;
      case 'ntfs':
        blk.stats.isNtfs = true;
        break;
      case 'vfat':
        blk.stats.isVfat = true;
        break;
      default:
        break;
    }
  } else if (blk.props.id_fs_usage === 'other') {

    blk.stats.isOtherFileSystem = true;
    if (blk.props.id_fs_type === 'swap') {
      // is swap disk
      blk.stats.isLinuxSwap = true;
    }
  } else if (blk.props.id_fs_usage === 'raid') {
    blk.stats.isRaidFileSystem = true;
  } else if (blk.props.id_fs_usage === 'crypto') {
    blk.stats.isCryptoFileSystem = true;
  } else {
    blk.stats.isUnsupportedFsUsage = true;
  }
};

// stat props (including hardware info)
// stat parentName
var statBlocksStatic = function statBlocksStatic(blocks) {
  return blocks.forEach(function (blk, idx, arr) {
    if (blk.props.devtype === 'disk') {
      // start of device is disk

      blk.stats.isDisk = true;
      blk.stats.model = blk.props.id_model;
      blk.stats.serial = blk.props.id_serial_short;

      // id_part_table_type override id_fs_usage, to fix #16
      if (blk.props.id_part_table_type) {
        // is partitioned disk
        blk.stats.isPartitioned = true;
        blk.stats.partitionTableType = blk.props.id_part_table_type;
        blk.stats.partitionTableUUID = blk.props.id_part_table_uuid;
      } else if (blk.props.id_fs_usage) // id_fs_usage defined
        statFsUsageDefined(blk);
    } else if (blk.props.devtype === 'partition') {
      // is partitioned

      // we dont know if the partition is whether formatted or not TODO
      blk.stats.isPartition = true;
      if (blk.props.id_fs_usage) statFsUsageDefined(blk);else if (blk.props.id_part_entry_type === '0x5') blk.stats.isExtended = true;

      var parent = arr.find(function (b) {
        return b.path === path.dirname(blk.path);
      });
      if (parent) blk.stats.parentName = parent.name;
    }
  });
};

// easy job, append idBus
var statBlocksBus = function statBlocksBus(blocks) {
  return blocks.forEach(function (blk) {
    blk.stats.idBus = blk.props.id_bus;
    if (blk.props.id_bus === 'usb') blk.stats.isUSB = true;else if (blk.props.id_bus === 'ata') blk.stats.isATA = true;else if (blk.props.id_bus === 'scsi') blk.stats.isSCSI = true;
  });
};

/**
 * stat blocks mount and swap, requires volumes stated first!
 *
 * isMounted, mountpoint, isRootFs, isActiveSwap
 *
 * for volume device, such info is copied from corresponding volume
 */
var statBlocksMountSwap = function statBlocksMountSwap(blocks, volumes, mounts, swaps) {
  return blocks.forEach(function (blk) {

    if (blk.stats.isVolumeDevice) {
      var volume = blockVolume(blk, volumes);
      if (volume && volume.stats.isMounted) {
        blk.stats.isMounted = true;
        blk.stats.mountpoint = volume.stats.mountpoint;
        if (volume.stats.isRootFS) blk.stats.isRootFS = true;
      }
    } else if (blk.stats.isFileSystem) {
      // it doesn't matter if this is a disk or a partition, as long as it has 
      // id_fs_usage === filesystem
      var mount = mounts.find(function (mnt) {
        return mnt.device === blk.props.devname;
      });
      if (mount) {
        blk.stats.isMounted = true;
        blk.stats.mountpoint = mount.mountpoint;
        if (mount.mountpoint === '/') blk.stats.isRootFS = true;
      }
    } else if (blk.stats.isLinuxSwap) {
      var swap = swaps.find(function (swap) {
        return swap.filename === blk.props.devname;
      });
      if (swap) blk.stats.isActiveSwap = true;
    }
  });
};

//
// formattable is a concept applicable only for blocks, either disk or partition (including non-formatted)
// extended partition is not formattable
// for partitioned disk
//   containing partitions that either isRootFS or isActiveSwap is unformattable
//   if (extended partition is excluded, this can be dont in recursive way.
// for partition or volume device
//   isExtended, or isRootFS, or isActiveSwap is unformattable
//
// the following code is not used, but it is a good reference for checking logic
var unformattable = function unformattable(block, blocks) {
  return block.stats.isDisk && blocks.stats.isPartitioned ? blocks.filter(function (blk) {
    return blk.stats.parentName === block.name && !blk.stats.isExtended;
  }).some(function (blk) {
    return unformattable(blk);
  }) : block.stats.isRootFS || block.stats.isActiveSwap;
}; // for volume device, isRootFS is copied from volume

// exactly the same logic with above
// returns non-empty array or single object containing name and reason
var unformattableReason = function unformattableReason(block, blocks) {

  if (block.stats.isDisk && block.stats.isPartitioned) {
    var reasons = blocks.filter(function (blk) {
      return blk.stats.parentName === block.name && !blk.stats.isExtended;
    }).map(function (blk) {
      return unformattableReason(blk, blocks);
    }).filter(function (r) {
      return !!r;
    });
    if (reasons.length) return reasons; // return array
  } else if (block.stats.isRootFS || block.stats.isActiveSwap) {
    // return object
    return {
      name: block.name,
      reason: block.stats.isRootFS ? 'isRootFS' : 'isActiveSwap'
    };
  }
  return null;
};

/**
 * volumes must be stated first.
 */
var statBlocks = function statBlocks(_ref10) {
  var blocks = _ref10.blocks,
      volumes = _ref10.volumes,
      mounts = _ref10.mounts,
      swaps = _ref10.swaps;


  blocks.forEach(function (blk) {
    return blk.stats = {};
  });
  statBlocksStatic(blocks);
  statBlocksBus(blocks);
  statBlocksMountSwap(blocks, volumes, mounts, swaps);

  // stat unformattable reason 
  blocks.forEach(function (blk) {
    var reason = unformattableReason(blk, blocks);
    if (reason) blk.stats.unformattable = reason;
  });
};

// duplicate minimal information
var statVolumes = function statVolumes(volumes, mounts) {
  return volumes.forEach(function (vol) {

    // volume must keep file system info since it may be used as file system object
    vol.stats = {
      isVolume: true,
      isMissing: vol.missing,
      isFileSystem: true,
      isBtrfs: true,
      fileSystemType: 'btrfs',
      fileSystemUUID: vol.uuid
    };

    var mount = volumeMount(vol, mounts);
    if (mount) {
      vol.stats.isMounted = true;
      vol.stats.mountpoint = mount.mountpoint;
      if (mount.mountpoint === '/') vol.stats.isRootFS = true;
    }
  });
};

var prettyStorage = function prettyStorage(storage) {

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

    // this is possible if volume mount failed, which is observed on at least one machine
    if (!usage) {

      var _mapped = (0, _assign2.default)({}, vol, vol.stats); // without usage
      delete _mapped.stats;

      _mapped.devices = vol.devices.map(function (dev) {
        return {
          name: path.basename(dev.path), // tricky
          path: dev.path,
          id: dev.id,
          used: dev.used
        };
      });

      return _mapped;
    }

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
        name: path.basename(dev.path), // tricky
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

/**

  Since persistence has no abort method (even if it has one, instant stopping all actions
  can not be guaranteed in nodejs), this may be an issue for testing.

  one way is using different fpath for each test, avoiding race in writing files.

  another way is to nullify persistence in testing, if that feature are not going to be tested.

  this module is not written in JavaScript class and singleton-ized with an object. Instead,
  it is a global object itself, which eliminates the need of another global object as holder.

  But all states are held in one object and initAsync method will refresh them all. This
  enables testability. 
   
**/
module.exports = {

  persistence: null,
  storage: null,

  get: function get(raw) {
    if (!this.storage) return null;
    return raw ? this.storage : prettyStorage(this.storage);
  },

  refreshAsync: function () {
    var _ref11 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8() {
      var storage;
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return (0, _bluebird.resolve)(probeStorageWithUsages());

            case 2:
              storage = _context8.sent;

              statVolumes(storage.volumes, storage.mounts);
              statBlocks(storage);

              this.storage = storage;
              (0, _deepFreeze2.default)(this.storage);

              if (this.persistence) this.persistence.save(prettyStorage(storage));

              return _context8.abrupt('return', prettyStorage(this.storage));

            case 9:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, this);
    }));

    function refreshAsync() {
      return _ref11.apply(this, arguments);
    }

    return refreshAsync;
  }(),

  initAsync: function () {
    var _ref12 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee9(fpath, tmpdir) {
      return _regenerator2.default.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              _context9.next = 2;
              return (0, _bluebird.resolve)(createPersistenceAsync(fpath, tmpdir, 500));

            case 2:
              this.persistence = _context9.sent;

              this.storage = null;

            case 4:
            case 'end':
              return _context9.stop();
          }
        }
      }, _callee9, this);
    }));

    function initAsync(_x10, _x11) {
      return _ref12.apply(this, arguments);
    }

    return initAsync;
  }()
};