'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mkfsBtrfsOperation = exports.refreshStorage = exports.mountedFS = undefined;

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

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
            return (0, _bluebird.all)(filtered.map(function (mnt) {
              return probeUsage(mnt.mountpoint);
            }));

          case 3:
            return _context6.abrupt('return', _context6.sent);

          case 4:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function probeUsages(_x9) {
    return _ref8.apply(this, arguments);
  };
}();

var probeStorageWithUsages = function () {
  var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7() {
    var storage, mounts, usages;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return probeStorage();

          case 2:
            storage = _context7.sent;
            _context7.next = 5;
            return mountVolumesAsync(storage.volumes, storage.mounts);

          case 5:
            _context7.next = 7;
            return mountNonVolumesAsync(storage.blocks, storage.mounts);

          case 7:
            _context7.next = 9;
            return probeMounts();

          case 9:
            mounts = _context7.sent;
            _context7.next = 12;
            return (0, _bluebird.delay)(100);

          case 12:
            _context7.next = 14;
            return probeUsages(mounts);

          case 14:
            usages = _context7.sent;
            return _context7.abrupt('return', (0, _assign2.default)({}, storage, { mounts: mounts, usages: usages }));

          case 16:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
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


//  disk
//    id_fs_usage defined
//    id_fs_usage not defined by id_part_table_type defined 


var refreshStorage = function () {
  var _ref12 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee10() {
    var obj;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return probeStorageWithUsages();

          case 2:
            obj = _context10.sent;


            statBlocks(obj);
            statVolumes(obj);
            _context10.next = 7;
            return statFruitmix(obj);

          case 7:

            // debug('stat blocks', obj.blocks.map(blk => Object.assign({}, { name: blk.name}, blk.stats)))

            if (!firstLog++) console.log('[storage] first probe', obj);
            (0, _reducers.storeDispatch)({
              type: 'STORAGE_UPDATE',
              data: obj
            });

            debug('storage refreshed: ', obj);

          case 10:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function refreshStorage() {
    return _ref12.apply(this, arguments);
  };
}();

/*
 *  if disk not ata fail
 *  if disk belongs to docker volume, fail (user must delete docker volume first)
 *  if disk belongs to non-docker volume, and the volume is rootfs, fail
 *  if disk belongs to rootfs, fail
 * 
 *  umount volumes containing disk, if fail, fail
 *  umount non volume disks, if fail, fail
 *  
 *  mkfs.btrfs, if fail, fail
 *  
 */

/*
 *
 * block object creating btrfs volume rules:
 * 
 * (assuming system is not running)
 * 
 * FORCE_NON_REMOVABLE (may include emmc)
 * FORCE_ATA_SCSI (id_bus =/= usb)
 * NO_ACTIVE_SWAP
 * NO_ROOTFS (including rootfs partition as well as rootfs volume)
 *
 *  
 */


var createVolume = function () {
  var _ref13 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee11(blknames, opts) {
    var mode, storage, daemon, mps, stdout, blknamesValidation, blknamesMounted;
    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            blknamesMounted = function blknamesMounted(blknames, blocks, volumes, mounts, swaps) {

              var mountpoints = [];
              blknames.forEach(function (blkname) {

                var block = blocks.find(function (blk) {
                  return blk.props.devname === blkname;
                });
                var volume = blockVolume(block, volumes);
                if (volume) {
                  var mnt = volumeMount(volume, mounts);
                  if (mnt) mountpoints.push(mnt.mountpoint);
                } else {
                  var parts = blockPartitions(block, blocks);
                  parts.forEach(function (part) {
                    var mnt = blockMount(part, volumes, mounts);
                    if (mnt) mountpoints.push(mnt.mountpoint);
                  });
                }
              });
              return mountpoints.filter(function (mp, pos, self) {
                return self.indexOf(mp) === pos;
              });
            };

            blknamesValidation = function blknamesValidation(blknames, blocks, volumes, mounts, swaps, daemon) {

              debug('blknames validation begin');

              blknames.forEach(function (blkname) {

                // find corresponding block (object)
                var block = blocks.find(function (blk) {
                  return blk.props.devname === blkname;
                });

                // must exists
                if (!block) throw new InvalidError(blkname + ' not found');

                // must be disk (partition is not allowed)
                if (block.props.devtype !== 'disk') throw new InvalidError(blkname + ' is not a disk');

                // must be ata or scsi, usb is not allowed
                if (block.props.id_bus !== 'ata' && block.props.id_bus !== 'scsi') throw new InvalidError(blkname + ' is not ata disk');

                // check if the block belongs to a volume
                var volume = blockVolume(block, volumes);
                if (volume) {

                  debug('block ' + block.name + ' is in volume ' + volume.uuid);

                  if (daemon.running && daemon.volume === volume.uuid) throw new InvalidError(blkname + ' is a device of running app engine volume, stop app engine before proceeding');
                  var mnt = volumeMount(volume, mounts);
                  if (mnt && mnt.mountpoint === '/') throw new InvalidError(blkname + ' is a device of system volume'); // not tested TODO
                } else {

                  debug('block ' + block.name + ' is not in any volume');

                  var parts = blockPartitions(block, blocks);

                  debug('block ' + block.name + ' contains partitions:', parts.map(function (p) {
                    return p.name;
                  }));

                  parts.forEach(function (part) {
                    var mnt = blockMount(part, volumes, mounts);
                    if (mnt && mnt.mountpoint === '/') throw new InvalidError(blkname + ' contains root partition ' + part.devname); // not tested TODO
                    if (swaps.find(function (swap) {
                      return swap.filename === part.devname;
                    })) throw new InvalidError(blkname + ' contains swap partition ' + part.devname); // not tested TODO
                  });

                  debug('block ' + block.name + ' contains neither system root nor swap partition');
                }
              });

              debug('blknames validation end');
            };

            info('createVolume');
            info('blknames: ' + blknames.join(','));

            mode = opts.mode;

            if (mode === undefined) mode = 'single';

            if (!(mode !== 'single' && mode !== 'raid0' && mode !== 'raid1')) {
              _context11.next = 8;
              break;
            }

            return _context11.abrupt('return', new Error('invalid mode, only single, raid0, raid1 are supported'));

          case 8:
            debug('mode:', mode);

            if (blknames.length) {
              _context11.next = 11;
              break;
            }

            throw new InvalidError('device names empty');

          case 11:
            debug('blknames:', blknames);

            // undupe
            blknames = blknames.filter(function (blkname, index, self) {
              return index === self.indexOf(blkname);
            });

            // probe storage
            _context11.next = 15;
            return probeStorage();

          case 15:
            storage = _context11.sent;
            _context11.next = 18;
            return (0, _docker.probeDaemon)();

          case 18:
            daemon = _context11.sent;

            if (!(storage.blocks === null)) {
              _context11.next = 21;
              break;
            }

            return _context11.abrupt('return');

          case 21:
            if (!(storage.blocks.length === 0)) {
              _context11.next = 23;
              break;
            }

            return _context11.abrupt('return');

          case 23:

            // validate
            blknamesValidation(blknames, storage.blocks, storage.volumes, storage.mounts, storage.swaps, daemon);

            // find mounted mountpoints
            mps = blknamesMounted(blknames, storage.blocks, storage.volumes, storage.mounts);


            info('blknames mounted: ' + mps.join(' ') + ', un-mounting');

            // umount mounted
            _context11.next = 28;
            return (0, _bluebird.all)(mps.map(function (mp) {
              return new _bluebird2.default(function (resolve, reject) {
                _child_process2.default.exec('umount ' + mp, function (err, stdout, stderr) {
                  return err ? reject(err) : resolve(stdout);
                });
              });
            }));

          case 28:

            info('unmount mounted blknames successfully');

            _context11.next = 31;
            return new _bluebird2.default(function (resolve, reject) {
              _child_process2.default.exec('mkfs.btrfs -d ' + mode + ' -f ' + blknames.join(' '), function (err, stdout, stderr) {
                err ? reject(err) : resolve(stdout);
              });
            });

          case 31:
            stdout = _context11.sent;


            info('mkfs.btrfs successfully');

            _context11.next = 35;
            return probeStorageWithUsages();

          case 35:
            storage = _context11.sent;
            return _context11.abrupt('return', storage.volumes.find(function (vol) {
              return vol.devices.length === blknames.length && vol.devices.every(function (dev) {
                return blknames.find(function (bn) {
                  return bn === dev.path;
                });
              });
            }));

          case 37:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function createVolume(_x12, _x13) {
    return _ref13.apply(this, arguments);
  };
}();

// check if a block is formattable
// return null if YES
// return object representing unformattable reason
//   type: rootfs, swap, extended
//   volume: block is a disk and in a volume (uuid)
//   disk: block is a disk containing standalone file system (devname)
//   partition: block is either a partition or a partitioned disk, containing a partition
//              with given type of problem. 


var testOperation = function () {
  var _ref18 = (0, _bluebird.method)(function () {

    return new _bluebird2.default(function (resolve, reject) {
      setTimeout(function () {
        console.log('test operation timeout (deliberately)');
        resolve('hello');
      }, 3000);
    });
  });

  return function testOperation() {
    return _ref18.apply(this, arguments);
  };
}();

var mkfsBtrfsOperation = function () {
  var _ref19 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee16(arg) {
    var opts, blknames;
    return _regenerator2.default.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:

            debug('mkfsBtrfsOperation');

            opts = { mode: arg.mode };
            blknames = arg.blknames;
            _context16.next = 5;
            return createVolume(blknames, opts);

          case 5:
            _context16.next = 7;
            return refreshStorage();

          case 7:
            return _context16.abrupt('return', {});

          case 8:
          case 'end':
            return _context16.stop();
        }
      }
    }, _callee16, this);
  }));

  return function mkfsBtrfsOperation(_x21) {
    return _ref19.apply(this, arguments);
  };
}();

var _operation = function () {
  var _ref20 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee17(req) {
    var f, args;
    return _regenerator2.default.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            f = void 0, args = void 0;

            if (!(req && req.operation)) {
              _context17.next = 13;
              break;
            }

            info('operation: ' + req.operation);

            args = req.args && Array.isArray(req.args) ? req.args : [];
            _context17.t0 = req.operation;
            _context17.next = _context17.t0 === 'test' ? 7 : _context17.t0 === 'mkfs_btrfs' ? 9 : 11;
            break;

          case 7:
            f = testOperation;
            return _context17.abrupt('break', 13);

          case 9:
            f = mkfsBtrfsOperation;
            return _context17.abrupt('break', 13);

          case 11:
            info('operation: ' + req.operation + ' is not implemented');
            return _context17.abrupt('break', 13);

          case 13:
            if (!f) {
              _context17.next = 16;
              break;
            }

            _context17.next = 16;
            return f.apply(undefined, (0, _toConsumableArray3.default)(args));

          case 16:
            return _context17.abrupt('return', { errno: 0 });

          case 17:
          case 'end':
            return _context17.stop();
        }
      }
    }, _callee17, this);
  }));

  return function _operation(_x22) {
    return _ref20.apply(this, arguments);
  };
}();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('../lib/reducers');

var _docker = require('../lib/docker');

var _udevMonitor = require('../../system/udevMonitor');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO
(0, _bluebird.promisifyAll)(_child_process2.default);
(0, _bluebird.promisifyAll)(_fs2.default);
var mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
var rimrafAsync = (0, _bluebird.promisify)(_rimraf2.default);

var debug = (0, _debug2.default)('system:storage');

var udevInfo = require('./udevInfoAsync');
var probeMounts = require('./procMountsAsync');
var probeSwaps = require('./procSwapsAsync');
var probeVolumes = require('./btrfsfishowAsync');
var probeUsage = require('./btrfsusageAsync');


function info(text) {
  console.log('[storage] ' + text);
}

var InvalidError = function (_Error) {
  (0, _inherits3.default)(InvalidError, _Error);

  function InvalidError(message) {
    (0, _classCallCheck3.default)(this, InvalidError);

    var _this = (0, _possibleConstructorReturn3.default)(this, (InvalidError.__proto__ || (0, _getPrototypeOf2.default)(InvalidError)).call(this, message));

    _this.message = message;
    _this.name = 'InvalidError';
    return _this;
  }

  return InvalidError;
}(Error);

var OperationFailError = function (_Error2) {
  (0, _inherits3.default)(OperationFailError, _Error2);

  function OperationFailError(message) {
    (0, _classCallCheck3.default)(this, OperationFailError);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (OperationFailError.__proto__ || (0, _getPrototypeOf2.default)(OperationFailError)).call(this, message));

    _this2.message = message;
    _this2.name = 'OperationFailError';
    return _this2;
  }

  return OperationFailError;
}(Error);

var probePorts = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _child_process2.default.execAsync('find /sys/class/ata_port -type l');

          case 2:
            _context.t0 = function (l) {
              return l.trim();
            };

            _context.t1 = function (l) {
              return l.length;
            };

            _context.t2 = _context.sent.toString().split('\n').map(_context.t0).filter(_context.t1);
            return _context.abrupt('return', udevInfo(_context.t2));

          case 6:
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

var probeBlocks = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return _child_process2.default.execAsync('find /sys/class/block -type l');

          case 2:
            _context2.t0 = function (l) {
              return l.trim();
            };

            _context2.t1 = function (l) {
              return l.length;
            };

            _context2.t2 = function (l) {
              return l.startsWith('/sys/class/block/sd');
            };

            _context2.t3 = _context2.sent.toString().split('\n').map(_context2.t0).filter(_context2.t1).filter(_context2.t2);
            return _context2.abrupt('return', udevInfo(_context2.t3));

          case 7:
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

var probeStorage = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var result, storage;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _bluebird.all)([probePorts(), probeBlocks(), probeVolumes(), probeMounts(), probeSwaps()]);

          case 2:
            result = _context3.sent;
            storage = {
              ports: result[0],
              blocks: result[1],
              volumes: result[2],
              mounts: result[3],
              swaps: result[4]
            };


            debug('first-round storage probe', storage);
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

// return mount object if given volume is mounted
var volumeMount = function volumeMount(volume, mounts) {
  return mounts.find(function (mnt) {
    return volume.devices.find(function (dev) {
      return dev.path === mnt.device;
    });
  });
};

// return volume object if given block (disk) is a volume deice
var blockVolume = function blockVolume(block, volumes) {
  return volumes.find(function (vol) {
    return vol.devices.find(function (dev) {
      return dev.path === block.props.devname;
    });
  });
};

// return mount object either block is a partition/disk or a volume
var blockMount = function blockMount(block, volumes, mounts) {

  var volume = blockVolume(block, volumes);
  return volume ? volumeMount(volume, mounts) : mounts.find(function (mnt) {
    return mnt.device === block.props.devname;
  });
};

// this function returns partitions of a disk
// block: must be a disk type block object
var blockPartitions = function blockPartitions(block, blocks) {
  return blocks.filter(function (blk) {
    return blk.props.devtype === 'partition' && _path2.default.dirname(blk.props.devpath) === block.props.devpath;
  });
};

var mountVolumeAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(uuid, mountpoint, opts) {
    var cmd;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return mkdirpAsync(mountpoint);

          case 2:
            cmd = opts ? 'mount -t btrfs -o {opts} UUID=' + uuid + ' ' + mountpoint : 'mount -t btrfs UUID=' + uuid + ' ' + mountpoint;
            _context4.next = 5;
            return _child_process2.default.execAsync(cmd);

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

var volumeMountpoint = function volumeMountpoint(vol) {
  return '/run/wisnuc/volumes/' + vol.uuid;
};
var blockMountpoint = function blockMountpoint(blk) {
  return '/run/wisnuc/blocks/' + blk.name;
};

var mountVolumesAsync = function () {
  var _ref5 = (0, _bluebird.method)(function (volumes, mounts) {

    var unmounted = volumes.filter(function (vol) {
      return volumeMount(vol, mounts) === undefined;
    });

    debug('mounting volumes', unmounted);

    return (0, _bluebird.map)(unmounted, function (vol) {
      return mountVolumeAsync(vol.uuid, volumeMountpoint(vol), vol.missing ? 'degraded,ro' : null);
    });
  });

  return function mountVolumesAsync(_x4, _x5) {
    return _ref5.apply(this, arguments);
  };
}();

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
                return mkdirpAsync(dir);

              case 3:
                _context5.next = 5;
                return _child_process2.default.execAsync('mount ' + blk.props.devname + ' ' + dir);

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

    var unmounted = blocks.filter(function (blk) {

      // if blk is disk
      //   blk is fs && fs type is (ext4 or ntfs or vfat) && blk is not mounted
      // if block is partition
      //   blk is fs && fs type is (ext4 or ntfs or vfat) && blk is not mounted

      if (blk.props.devtype === 'disk' || blk.props.devtype === 'partition') {
        if (blk.props.id_fs_usage === 'filesystem') {
          var _type = blk.props.id_fs_type;
          if (_type === 'ext4' || _type === 'ntfs' || _type === 'vfat') {
            if (!mounts.find(function (mnt) {
              return mnt.device === blk.props.devname;
            })) return true;
          }
        }
      }
    });

    debug('mounting blocks', unmounted);

    return (0, _bluebird.map)(unmounted, function (blk) {
      if (blk.props.id_bus === 'usb') return _child_process2.default.execAsync('udisksctl mount --block-device ' + blk.props.devname + ' --no-user-interaction');else return mountNonUSB(blk);
    });
  });

  return function mountNonVolumesAsync(_x6, _x7) {
    return _ref6.apply(this, arguments);
  };
}();

var statBlocks = function statBlocks(storage) {
  var blocks = storage.blocks,
      volumes = storage.volumes,
      mounts = storage.mounts,
      swaps = storage.swaps;


  blocks.forEach(function (blk) {
    return blk.stats = {};
  });

  blocks.forEach(function (blk, idx, arr) {

    if (blk.props.devtype === 'disk') {
      // start of device is disk
      blk.stats.isDisk = true;

      if (blk.props.id_fs_usage) {
        // id_fs_usage defined
        blk.stats.isUsedAsFileSystem = true;

        if (blk.props.id_fs_usage === 'filesystem') {
          // used as file system

          blk.stats.isFileSystem = true;
          blk.stats.fileSystemType = blk.props.id_fs_type;

          if (blk.props.id_fs_type === 'btrfs') {
            // is btrfs (volume device)
            blk.stats.isVolume = true;
            blk.stats.isBtrfs = true;
            blk.stats.btrfsVolume = blk.props.id_fs_uuid;
            blk.stats.btrfsDevice = blk.props.id_fs_uuid_sub;
          } else {

            switch (type) {
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

            blk.stats.fileSystemUUID = blk.props.id_fs_uuid;
          }
        } else if (blk.props.id_fs_usage === 'other') {

          blk.stats.isOtherFileSystem = true;
          if (blk.props.id_fs_type === 'swap') {
            // is swap disk
            blk.stats.fileSystemtype = 'swap';
            blk.stats.isLinuxSwap = true;
            blk.stats.fileSystemUUID = blk.props.id_fs_uuid;
          }
        } // end of used as other
        else {
            blk.stats.isUnsupportedFileSystem = true;
          }
      } // end of used as file system
      else if (blk.props.id_part_table_type) {
          // is partitioned disk
          blk.stats.isPartitioned = true;
          blk.stats.partitionTableType = blk.props.id_part_table_type;
          blk.stats.partitionTableUUID = blk.props.id_part_table_uuid;
        } else {
          blk.stats.noKnownFileSystemOrPartitionDetected = true;
        }
    } // end of 'device is disk'
    else if (blk.props.devtype === 'partition') {
        // is partitioned

        // we dont know if the partition is whether formatted or not TODO

        blk.stats.isPartition = true;
        if (blk.props.id_part_entry_type === '0x5') {
          blk.stats.isExtended = true;
        } else if (blk.props.id_part_entry_type === '0x82') {
          blk.stats.isLinuxSwap = true;
        } else if (blk.props.id_fs_usage === 'filesystem') {
          // partition as file system

          blk.stats.isFilesystem = true;
          var _type2 = blk.stats.fileSystemType = blk.props.id_fs_type;

          switch (_type2) {
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

          blk.stats.fileSystemUUID = blk.props.id_fs_uuid;
        }

        var parent = arr.find(function (b) {
          return b.path === _path2.default.dirname(blk.path);
        });
        if (parent) blk.stats.parentName = parent.name;
      }

    // stats bus
    if (blk.props.id_bus === 'usb') blk.stats.isUSB = true;else if (blk.props.id_bus === 'ata') blk.stats.isATA = true;else if (blk.props.id_bus === 'scsi') blk.stats.isSCSI = true;
  });

  // stats mount
  blocks.forEach(function (blk) {

    if (blk.stats.isDisk) {
      if (blk.stats.isFileSystem) {

        if (blk.stats.isBtrfs) {
          var volume = blockVolume(blk, volumes);
          var mount = volumeMount(volume, mounts);
          if (mount) {
            blk.stats.isMounted = true;
            blk.stats.mountpoint = mount.mountpoint;

            if (mount.mountpoint === '/') blk.stats.isRootFS = true;
          }
        } else if (blk.stats.isExt4 || blk.stats.isNtfs || blk.stats.isVfat) {
          var _mount = mounts.find(function (mnt) {
            return mnt.device === blk.props.devname;
          });
          if (_mount) {
            blk.stats.isMounted = true;
            blk.stats.mountpoint = _mount.mountpoint;
            if (_mount.mountpoint === '/') blk.stats.isRootFS = true;
          }
        }
      } else if (blk.stats.isOtherFileSystem) {
        if (blk.stats.isLinuxSwap) {
          if (swaps.find(function (swap) {
            return swap.filename === blk.props.devname;
          })) blk.stats.isActiveSwap = true;
        }
      }
    } else if (blk.stats.isPartition) {

      if (blk.stats.isLinuxSwap) {
        if (swaps.find(function (swap) {
          return swap.filename === blk.props.devname;
        })) blk.stats.isActiveSwap = true;
        return;
      }

      var _mount2 = mounts.find(function (mnt) {
        return mnt.device === blk.props.devname;
      });
      if (_mount2) {
        blk.stats.isMounted = true;
        blk.stats.mountpoint = _mount2.mountpoint;

        if (_mount2.mountpoint === '/') blk.stats.isRootFS = true;
      }
    }
  });
};

var statVolumes = function statVolumes(storage) {
  var volumes = storage.volumes,
      mounts = storage.mounts;


  volumes.forEach(function (vol) {

    vol.stats = {};
    var mount = volumeMount(vol, mounts);
    if (mount) {
      vol.stats.isFileSystem = true;
      vol.stats.isVolume = true;
      vol.stats.isBtrfs = true;
      vol.stats.fileSystemType = 'btrfs';
      vol.stats.fileSystemUUID = vol.uuid;
      vol.stats.isMounted = true;
      vol.stats.mountpoint = mount.mountpoint;
    }
  });
};

var mountedFS = exports.mountedFS = function mountedFS(storage) {
  var blocks = storage.blocks,
      volumes = storage.volumes;

  var nvfs = blocks.filter(function (blk) {
    return blk.stats.isFileSystem && (blk.stats.isExt4 || blk.stats.isNtfs || blk.stats.isVfat) && blk.isMounted;
  });

  var vfs = volumes.filter(function (vol) {
    return vol.stats.isMounted && !vol.missing;
  });

  return [].concat((0, _toConsumableArray3.default)(nvfs), (0, _toConsumableArray3.default)(vfs));
};

var statFruitmix = function () {
  var _ref10 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee9(storage) {
    var stat;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            stat = function () {
              var _ref11 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8(x) {
                var ins;
                return _regenerator2.default.wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        _context8.next = 2;
                        return _fs2.default.statAsync(_path2.default.join(x.stats.mountpoint, 'wisnuc/fruitmix')).reflect();

                      case 2:
                        ins = _context8.sent;

                        if (ins.isFulfilled() && ins.value().isDirectory()) x.stats.wisnucInstalled = true;

                      case 4:
                      case 'end':
                        return _context8.stop();
                    }
                  }
                }, _callee8, undefined);
              }));

              return function stat(_x11) {
                return _ref11.apply(this, arguments);
              };
            }();

            _context9.next = 3;
            return (0, _bluebird.map)(mountedFS(storage), function (x) {
              return stat(x);
            });

          case 3:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, undefined);
  }));

  return function statFruitmix(_x10) {
    return _ref10.apply(this, arguments);
  };
}();

var firstLog = 0;

var formattable = function formattable(block) {

  if (block.stats.isDisk) {

    // check mount point and active swap
    if (block.stats.isVolume) {
      var _ret = function () {

        // if is volume device, volume must not be rootfs
        var uuid = block.stats.btrfsVolume;
        var volume = volumes.find(function (vol) {
          return vol.uuid === uuid;
        });
        if (volume.stats.isMounted && volume.stats.mountpoint === '/') return {
            v: { type: 'rootfs', volume: uuid }
          };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
    } else if (block.stats.isFileSystem) {

      // if is standalone file system, file system must not be rootfs or active swap
      if (block.stats.isMounted && block.stats.mountpoint === '/') return { type: 'rootfs', disk: block.name };
      if (block.stats.isActiveSwap) return { type: 'swap', disk: block.name };
    } else if (block.stats.isPartitioned) {

      // if is partitioned, containing no partition that is either rootfs or swap
      var children = blocks.filter(function (blk) {
        return blk.stats.isPartition && !blk.stats.parentName === block.name;
      });

      for (var i = 0; i < children.length; i++) {
        if (children[i].isMounted && children[i].mountpoint === '/') return { type: 'rootfs', partition: children[i].name };

        if (children[i].isActiveSwap) return { type: 'swap', partition: children[i].name };
      }
    }
  } else if (block.stats.isPartition) {

    if (block.stats.isExtended) return { type: 'extended', partition: block.name };

    if (block.stats.isMounted && block.stats.mountpoint === '/') return { type: 'rootfs', partition: block.name };

    if (block.stats.isActiveSwap) return { type: 'swap', partition: block.name };
  }

  return null;
};

// must exists
// must be disk
// must be ata or scsi, if opts set
// --- volume, volume must not be rootfs
// --- disk / filesystem, fs must not be rootfs
// --- disk / partitioned, no partition is rootfs or active swap
var validateBtrfsCandidates = function validateBtrfsCandidates(target) {

  var error = function error(text, code, reason) {
    return (0, _assign2.default)(new Error(text), reason ? { code: code, reason: reason } : { code: code });
  };

  var _storeState$storage = (0, _reducers.storeState)().storage,
      blocks = _storeState$storage.blocks,
      volumes = _storeState$storage.volumes;

  var _loop = function _loop(i) {

    var block = blocks.find(function (blk) {
      return blk.name === target[i];
    });

    // non-exist
    if (!block) return {
        v: error('block ' + target[i] + ' does not exist', 'ENOENT')
      };

    // not a disk
    if (!block.stats.isDisk) return {
        v: error('block ' + target[i] + ' is not a disk', 'ENOTDISK')
      };

    // for wisnuc device, disk must be ATA or SCSI
    if (isWisnucDevice && !block.stats.isATA && !block.stats.isSCSI) // NOTATAORSCSI
      return {
        v: error('block ' + target[i] + ' is not an ata or scsi disk', 'ENOTATAORSCSI')
      };

    var fmt = formattable(block);
    if (fmt) return {
        v: error('formatting block device ' + target[i] + ' is forbidden', 'EFORBIDDEN', fmt)
      };
  };

  for (var i = 0; i < target.length; i++) {
    var _ret2 = _loop(i);

    if ((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object") return _ret2.v;
  }

  return null;
};

// single block, can be either disk or partition
var validateOtherFSCandidates = function validateOtherFSCandidates(target) {
  var _storeState$storage2 = (0, _reducers.storeState)().storage,
      blocks = _storeState$storage2.blocks,
      volumes = _storeState$storage2.volumes;


  if (target.length !== 1) return error('must be exactly one block device', 'EINVAL');

  var block = blocks.find(function (blk) {
    return blk.name === target[0];
  });
  if (!block) return error('block ' + target[0] + ' does not exist', 'ENOENT');

  var reason = formattable(block);
  if (reason) return error('formatting block device ' + block.name + ' is forbidden', 'EFORBIDDEN', reason);

  return null;
};

var umount = function umount(mountpoint, callback) {
  return _child_process2.default.exec('umount ' + mountpoint, function (err) {
    return callback(err);
  });
};

var umountAsync = (0, _bluebird.promisify)(umount);

var umountBlocks = function () {
  var _ref14 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee12(target) {
    var _storeState$storage3, blocks, volumes, blks, uuids, mvols, mparts, mblks, i;

    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _storeState$storage3 = (0, _reducers.storeState)().storage, blocks = _storeState$storage3.blocks, volumes = _storeState$storage3.volumes;
            blks = target.map(function (name) {
              return blocks.find(function (blk) {
                return blk.name === name;
              });
            });

            // if it is volume device

            uuids = blks.filter(function (blk) {
              return blk.stats.isMounted;
            }) // filter mounted
            .filter(function (blk) {
              return blk.stats.isVolume;
            }) // filter volume devices
            .map(function (blk) {
              return blk.stats.btrfsVolume;
            }); // map to uuid (may dup)

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
              return blk.stats.isDisk && blk.stats.isPartitioned;
            }).reduce(function (prev, curr) {
              return prev.concat(blocks.filter(function (blk) {
                return blk.stats.parentName === curr.name;
              }));
            }, []).filter(function (blk) {
              return blk.stats.isMounted;
            });

            // the left should be partition or disk with standalone fs

            mblks = blks.filter(function (blk) {
              return blk.stats.isMounted;
            }) // filter mounted 
            .filter(function (blk) {
              return blk.stats.isPartition || // is partition
              blk.isDisk && blk.isFileSystem && !blk.isVolume;
            }); // is non-volume filesystem disk

            // for mounted volumes, normal umount
            // for mounted blocks (with fs)
            //  umount usb by udisksctl
            //  umount non-usb by normal umount

            i = void 0;
            i = 0;

          case 8:
            if (!(i < mvols.length)) {
              _context12.next = 15;
              break;
            }

            debug('un-mounting volume ' + mvol[i].uuid);
            _context12.next = 12;
            return umountAsync(mvols[i].stats.mountpoint);

          case 12:
            i++;
            _context12.next = 8;
            break;

          case 15:
            i = 0;

          case 16:
            if (!(i < mparts.length)) {
              _context12.next = 23;
              break;
            }

            debug('un-mounting partition ' + mparts[i].name);
            _context12.next = 20;
            return umountAsync(mparts[i].stats.mountpoint);

          case 20:
            i++;
            _context12.next = 16;
            break;

          case 23:
            i = 0;

          case 24:
            if (!(i < mblks.length)) {
              _context12.next = 31;
              break;
            }

            debug('un-mounting block ' + mblk[i].name);
            _context12.next = 28;
            return umountAsync(mblks[i].stats.mountpoint);

          case 28:
            i++;
            _context12.next = 24;
            break;

          case 31:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, undefined);
  }));

  return function umountBlocks(_x14) {
    return _ref14.apply(this, arguments);
  };
}();

var makeBtrfs = function makeBtrfs(target, mode, callback) {

  umountBlocks(target).asCallback(function (err) {
    if (err) return callback(err);

    var storage = (0, _reducers.storeState)().storage;
    var blocks = storage.blocks;

    var devices = target.map(function (name) {
      return blocks.find(function (blk) {
        return blk.name === name;
      });
    }).map(function (blk) {
      return blk.name;
    });

    var cmd = 'mkfs.btrfs -d ' + mode + ' -f ' + devices.join(' ');
    _child_process2.default.exec(cmd, function (err, stdout, stderr) {
      debug('make btrfs', cmd, stdout, stderr);
      callback(err);
    });
  });
};

var makeExt4 = function makeExt4(target, callback) {

  unmountBlocks(target).asCallback(function (err) {
    if (err) return callback(err);

    // child.exec(`mkfs.btrfs 
  });
};

var mkfsBtrfs = function () {
  var _ref15 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee13(target, opts) {
    var blocks, err;
    return _regenerator2.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.next = 2;
            return refreshStorage();

          case 2:
            // with stats decoration

            blocks = (0, _reducers.storeState)().storage.blocks;


            debug('mkfsBtrfs', target, opts);

            target = (0, _from2.default)(new _set2.default(target)).sort();

            err = validateBtrfsCandidates(target);

            if (!err) {
              _context13.next = 8;
              break;
            }

            throw err;

          case 8:
            _context13.next = 10;
            return umountBlocks(target);

          case 10:

            debug('mkfsBtrfs success');

          case 11:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, undefined);
  }));

  return function mkfsBtrfs(_x15, _x16) {
    return _ref15.apply(this, arguments);
  };
}();

var mkfsExt4 = function () {
  var _ref16 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee14(target, opts) {
    var err;
    return _regenerator2.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return refreshStorage();

          case 2:
            // with stats decoration

            debug('mkfsExt4', target, opts);

            target = (0, _from2.default)(new _set2.default(target)).sort();

            err = validateExt4Candidates(target);

            if (!err) {
              _context14.next = 7;
              break;
            }

            throw err;

          case 7:
            _context14.next = 9;
            return umountBlocks(target);

          case 9:

            debug('mkfsExt4 success');

          case 10:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, undefined);
  }));

  return function mkfsExt4(_x17, _x18) {
    return _ref16.apply(this, arguments);
  };
}();

var mkfsNtfs = function () {
  var _ref17 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee15(target, opts) {
    var err;
    return _regenerator2.default.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.next = 2;
            return refreshStorage();

          case 2:

            debug('mkfsNtfs', target, opts);

            target = (0, _from2.default)(new _set2.default(target)).sort();
            err = validateOtherFSCandidates(target);

            if (!err) {
              _context15.next = 7;
              break;
            }

            throw err;

          case 7:
            _context15.next = 9;
            return umountBlocks(target);

          case 9:

            debug('mkfsNtfs success');

          case 10:
          case 'end':
            return _context15.stop();
        }
      }
    }, _callee15, undefined);
  }));

  return function mkfsNtfs(_x19, _x20) {
    return _ref17.apply(this, arguments);
  };
}();

var udevMon = (0, _udevMonitor.createUdevMonitor)();

udevMon.on('events', function (events) {

  debug('udev events', events);

  var add = false;
  var remove = false;

  events.forEach(function (evt) {
    if (evt.action === 'add') add = true;
    if (evt.action === 'remove') remove = true;
  });

  refreshStorage().then(function () {

    var storage = (0, _reducers.storeState)().storage;
    var count = 0;

    storage.blocks.forEach(function (blk) {

      var stats = blk.stats;
      var fsMountable = function fsMountable(stats) {
        return stats.isFileSystem && !stats.isVolume;
      };

      if (stats.isUSB && !stats.isMounted && fsMountable(stats)) {
        if (stats.fileSystemType === 'vfat' || stats.fileSystemType === 'ext4' || stats.fileSystemType === 'ntfs') {

          debug('mounting ' + blk.props.devname, stats);

          ++count;
          _child_process2.default.exec('udisksctl mount --block-device ' + blk.props.devname + ' --no-user-interaction', function (err) {
            if (! --count) {

              debug('refresh again');
              refreshStorage().then(function () {
                debug('refresh done');
              }).catch(function (e) {});
            }
          });
        }
      }
    });
  }).catch(function (e) {});
});

exports.default = {

  operation: function operation(req, callback) {
    return _operation(req).then(function (r) {
      return callback(null, r);
    }).catch(function (e) {
      return callback(e);
    });
  }
};
exports.refreshStorage = refreshStorage;
exports.mkfsBtrfsOperation = mkfsBtrfsOperation;