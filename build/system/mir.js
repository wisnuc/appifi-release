'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('../appifi/lib/reducers');

var _sysconfig = require('./sysconfig');

var _sysconfig2 = _interopRequireDefault(_sysconfig);

var _storage = require('../appifi/lib/storage');

var _boot = require('./boot');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:mir');
var router = _express2.default.Router();

router.get('/', function (req, res) {

  var storage = (0, _reducers.storeState)().storage;
  if (!storage) return res.status(500).end();

  var ports = storage.ports.map(function (port) {
    return {
      path: port.path,
      subsystem: port.props.subsystem
    };
  });

  var blocks = storage.blocks.map(function (blk) {
    return (0, _assign2.default)({
      name: blk.name,
      devname: blk.props.devname,
      path: blk.path,
      removable: blk.sysfsProps[0].attrs.removable === "1",
      size: parseInt(blk.sysfsProps[0].attrs.size)
    }, blk.stats);
  });

  var usages = storage.usages;

  var volumes = storage.volumes.map(function (vol) {

    var usage = usages.find(function (usg) {
      return usg.mountpoint === vol.stats.mountpoint;
    });
    if (usage) delete usage.mountpoint;

    var mapped = (0, _assign2.default)({}, vol, vol.stats, { usage: usage });
    delete mapped.stats;

    mapped.devices = vol.devices.map(function (dev) {
      return {
        name: _path2.default.basename(dev.path),
        devname: dev.path,
        id: dev.id,
        size: dev.size,
        used: dev.used
      };
    });

    return mapped;
  });

  var ret = (0, _assign2.default)({}, storage, { ports: ports, blocks: blocks, volumes: volumes });
  delete ret.mounts;
  delete ret.swaps;
  delete ret.usages;

  res.status(200).json(ret);
});

/**

  target: ['sda'],  // if mkfs is NOT provided, which means starts from existing disk
                    // target must be single file system
                    // this can be either 1 block name or 1 uuid representing a btrfs volume
                    // for wisnuc device, 1 btrfs volume uuid is required
                    // for non-wisnuc device, 1 block name is also OK but the filesystem must be either ext4, or ntfs

                    // if mkfs IS provided, which means creating new filesystem
                    // this must 1 to N non-duplicated block names
                    // for wisnuc device, mkfs.type must be 'btrfs' and all blocks must be ATA disk
                    // for non-wisnuc device
                    //  if mkfs.type is btrfs, all blocks must be disk, either ATA/SCSI or USB
                    //  if mkfs.type is ext4, only one block is allowed, can be either ATA/SCSI or USB disk, or partition
                    //  if mkfs.type is ntfs, only one block is allowed, can be either ATA/SCSI or USB disk, or partition

  mkfs: {           
    type: 'btrfs',
    opts: raid mode  
  }

  init: {           // this must be provided if mkfs is provided
    username:       // if mkfs is NOT provided (starting from existing disk), if init is provided, the /wisnuc folder will be erased and re-created.
    password:
  }

  mkfs.btrfs: 0 -> n disks, with raid mode
  mkfs.ext4: 1 disk or 1 partition
  mkfs.ntfs

  install / reinstall

  ///////

  valid combination

  target only (which means run)

  target + init (which means overwrite and run)

  target + mkfs + init (which means mkfs + init + run)

**/

var isSingleUUID = function isSingleUUID(target) {
  return Array.isArray(target) && target.length === 1 && typeof target[0] === 'string' && _validator2.default.isUUID(target[0]);
};

var isSingleName = function isSingleName(target) {
  return Array.isArray(target) && target.length === 1 && typeof target[0] === 'string';
};

// return null for valid
// return string for error
var validateInit = function validateInit(init) {

  if (init === undefined) return null;

  if (init instanceof Object === false) return 'init is not an object';

  if (init.username === undefined) return 'init.username must be provided';
  if (typeof init.username !== 'string') return 'init.username must be a string';
  if (init.username.length === 0) return 'init.username must not be an empty string';

  // sanitize ???

  if (init.password === undefined) return 'init.password must be provided';
  if (typeof init.password !== 'string') return 'init.password must be a string';
  if (init.password.length === 0) return 'init.password must not be an empty string';

  return null;
};

var R = function R(res) {
  return function (code, error, reason) {

    var obj = void 0;
    if (error instanceof Error) {
      obj = {
        message: error.message,
        code: error.code
      };
    } else if (typeof error === 'string') obj = { message: error };else obj = { message: 'none' };

    if (reason) obj.reason = reason;
    return res.status(code).json(obj);
  };
};

var tryReboot = function tryReboot(lfs, callback) {
  _sysconfig2.default.set('lastFileSystem', lfs);
  _sysconfig2.default.set('bootMode', 'normal');
  (0, _boot.tryBoot)(callback);
};

router.post('/', function (req, res) {

  var bstate = (0, _reducers.storeState)().sysboot;
  if (bstate.state !== 'maintenance') return res.status(405).json({
    message: 'system is not in maintenance mode'
  });

  var startMountpoint = function startMountpoint(mp) {
    fs.stat(_path2.default.join(mp, 'wisnuc/fruitmix'), function (err, stats) {
      if (err) return R(res)(500, err);
      if (!stats.isDirectory()) return R(res)(405, 'wisnuc/fruitmix on target block or volume is not a directory');

      // start fruitmix TODO
      R(res)(200, 'fruitmix started on volume ' + volume.uuid);
    });
  };

  var installMountpoint = function installMountpoint(mp) {

    var fruit = _path2.default.join(mp, 'wisnuc/fruitmix');
    (0, _rimraf2.default)(fruit, function (err) {
      if (err) return R(res)(500, err);
      (0, _mkdirp2.default)(fruit, function (err) {
        if (err) return R(res)(500, err);

        // start fruitmix
        R(res)(200, 'fruitmix started on');
      });
    });
  };

  var mir = req.body;
  var storage = (0, _reducers.storeState)().storage;

  // first validation
  if (mir instanceof Object === false) return R(res)(400, 'invalid parameters');

  if (storage instanceof Object === false) return R(res)(500, 'storage not an object');

  var target = mir.target,
      mkfs = mir.mkfs,
      init = mir.init;
  var blocks = storage.blocks,
      volumes = storage.volumes;

  // target must be array 

  if (!Array.isArray(target)) return res.status(500).end();

  if (target && mkfs === undefined) {
    // install or run

    var err = validateInit(init);
    if (err) return R(res)(400, err);

    // target must be single UUID or block containing supported fs
    // target must contains wisnuc 
    if (!isSingleName(target)) return R(res)(400, 'To install or run fruitmix, target must be single block name or volume uuid');

    if (isSingleUUID(target)) {
      var _ret = function () {

        var uuid = target[0];
        var volume = volumes.find(function (vol) {
          return vol.uuid === uuid;
        });
        debug('volume', volume);

        if (!volume) return {
            v: R(res)(404, 'volume ' + uuid + ' not found')
          };
        if (volume.missing) return {
            v: R(res)(405, 'volume ' + volume.uuid + ' has missing disk')
          };
        if (!volume.stats.isMounted || !volume.stats.mountpoint) return {
            v: R(res)(500, 'volume is not mounted, or mountpoint is not correctly parsed')
          };

        var mp = volume.stats.mountpoint;

        if (init) {
          debug('installing AND running wisnuc on volume ' + uuid + ' mounted @ ' + mp);
          if (mp !== '/') {
            // guard, TODO
            (0, _rimraf2.default)(_path2.default.join('mp', 'wisnuc'), function (err) {
              (0, _storage.installFruitmixAsync)(mp, init).asCallback(function (err) {
                tryReboot({
                  type: 'btrfs',
                  uuid: volume.uuid
                }, function () {});
                return R(res)(200, 'ok');
              });
            });
          }
        } else {
          debug('running wisnuc on volume ' + uuid + ' mounted @ ' + mp);
          tryReboot({
            type: 'btrfs',
            uuid: volume.uuid
          }, function () {});
          return {
            v: R(res)(200, 'ok')
          };
        }
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
    } else {
      var _ret2 = function () {

        var name = target[0];
        var block = blocks.find(function (blk) {
          return blk.name === name;
        });
        if (!block) return {
            v: R(res)(404, 'block device ' + name + ' not found')
          };

        if (block.stats.isVolume) {
          return {
            v: R(res)(405, 'block device ' + name + ' is a volume device, please use volume uuid as argument')
          };
        } else if (block.stats.isDisk) {
          // non-volume disk
          if (block.isPartitioned) return {
              v: R(res)(405, 'block device ' + name + ' is a partitioned disk')
            };
          if (!block.stats.isFileSystem) return {
              v: R(res)(405, 'block device ' + name + ' contains no file system')
            };
          if (!block.stats.isNtfs && !block.stats.isExt4) return {
              v: R(res)(405, 'block device ' + name + ' contains no ntfs or ext4')
            };
        } else if (block.stats.isPartition) {
          if (!block.stats.isNtfs && !block.stats.isExt4) return {
              v: R(res)(405, 'block device ' + name + ' contains no ntfs or ext4')
            };
        } else {
          return {
            v: R(res)(500, 'unexpected situation, contact developers')
          };
        }

        if (!block.stats.isMounted || !block.stats.mountpoint) return {
            v: R(res)(500, 'block device is not mounted, or mountpoint is not correctly parsed')
          };

        var mp = block.stats.mountpoint;
        return {
          v: startMountpoint(mp)
        };
      }();

      if ((typeof _ret2 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret2)) === "object") return _ret2.v;
    }
  } else if (target && init && mkfs) {
    var _blocks = storage.blocks;


    if (mkfs.type !== 'btrfs' && mkfs.type !== 'ext4' && mkfs.type !== 'ntfs') return R(res)(400, 'mkfs.type must be btrfs, ext4 or ntfs');

    // if mkfs type is btrfs
    //   target must be 1 - n disk
    // if mkfs type is ntfs or ext4
    //   target must be single disk or partition
    if (mkfs.type === 'btrfs') {

      if (target.length === 1) {
        if (mkfs.mode !== 'single') return R(res)(400, 'mkfs.mode can only be single if only one disk provided');
      } else {
        if (['single', 'raid0', 'raid1'].indexOf(mkfs.mode) === -1) return R(res)(400, 'mkfs.mode can only be single, raid0, or raid1');
      }

      var _loop = function _loop(i) {

        var name = target[i];
        var block = _blocks.find(function (blk) {
          return blk.name === name;
        });
        debug('block', block);

        if (!block) return {
            v: R(res)(404, 'block device ' + name + ' not found')
          };
        if (!block.stats.isDisk) return {
            v: R(res)(405, 'block device ' + name + ' is not a disk')
          };

        var reason = (0, _storage.formattable)(block);
        if (reason) return {
            v: R(res)(405, 'block device ' + name + ' cannot be formatted', reason)
          };
      };

      for (var i = 0; i < target.length; i++) {
        var _ret3 = _loop(i);

        if ((typeof _ret3 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret3)) === "object") return _ret3.v;
      }

      (0, _storage.mkfsBtrfs)(target, mkfs.mode, init, function (err, fsuuid) {

        if (err) return R(res)(500, err);
        R(res)(200, 'ok');
        /**
                sysconfig.set('lastFileSystem', { type: 'btrfs', uuid: fsuuid })
                sysconfig.set('bootMode', 'normal')
                tryBoot(() => {})
        **/

        tryReboot({
          type: 'btrfs',
          uuid: fsuuid
        }, function () {});
      });
    } else if (mkfs.type === 'ntfs' || mkfs.type === 'ext4') {
      return R(res)(500, 'not implemented yet');
    } else {
      return R(res)(405, 'unsupported mkfs type');
    }
  } else {
    // not supported combination
    return res.status(400).json({
      message: 'invalid combination of target, mkfs, and init'
    });
  }
});

exports.default = router;