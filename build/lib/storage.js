'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mkfsBtrfsOperation = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var portsPaths = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
              return child.exec('find /sys/class/ata_port -type l', function (err, stdout) {
                return (// stderr not used
                  err ? reject(err) : resolve((0, _utils.toLines)(stdout))
                );
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function portsPaths() {
    return _ref.apply(this, arguments);
  };
}();

var probePorts = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
    var paths;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return portsPaths();

          case 2:
            paths = _context2.sent;
            return _context2.abrupt('return', udevInfo(paths));

          case 4:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function probePorts() {
    return _ref2.apply(this, arguments);
  };
}();

var blockPaths = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt('return', new _promise2.default(function (resolve, reject) {
              return child.exec('find /sys/class/block -type l', function (err, stdout) {
                return (// stderr not used
                  err ? reject(err) : resolve((0, _utils.toLines)(stdout))
                );
              });
            }));

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function blockPaths() {
    return _ref3.apply(this, arguments);
  };
}();

var probeBlocks = function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
    var paths;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return blockPaths();

          case 2:
            paths = _context4.sent;

            paths = paths.filter(function (p) {
              return p.startsWith('/sys/class/block/sd');
            });
            return _context4.abrupt('return', udevInfo(paths));

          case 5:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function probeBlocks() {
    return _ref4.apply(this, arguments);
  };
}();

var probeStorage = function () {
  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5() {
    var result;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return _promise2.default.all([probePorts(), probeBlocks(), probeVolumes(), probeMounts(), probeSwaps()]);

          case 2:
            result = _context5.sent;
            return _context5.abrupt('return', {
              ports: result[0],
              blocks: result[1],
              volumes: result[2],
              mounts: result[3],
              swaps: result[4]
            });

          case 4:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function probeStorage() {
    return _ref5.apply(this, arguments);
  };
}();

var execAnyway = function () {
  var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(cmd) {
    var debug;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            debug = false;
            return _context6.abrupt('return', new _promise2.default(function (resolve) {
              return (// never reject
                child.exec(cmd, function (err, stdout, stderr) {
                  debug && console.log('---- execAnyway');
                  debug && console.log({ cmd: cmd, err: err, stdout: stdout, stderr: stderr });
                  resolve({ cmd: cmd, err: err, stdout: stdout, stderr: stderr });
                })
              );
            }));

          case 2:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function execAnyway(_x) {
    return _ref6.apply(this, arguments);
  };
}();

var mountVolumeAnyway = function () {
  var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(uuid, mountpoint, opts) {
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return execAnyway('mkdir -p ' + mountpoint);

          case 2:
            if (opts) execAnyway('mount -t btrfs -o {opts} UUID=' + uuid + ' ' + mountpoint);else execAnyway('mount -t btrfs UUID=' + uuid + ' ' + mountpoint);

          case 3:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function mountVolumeAnyway(_x2, _x3, _x4) {
    return _ref7.apply(this, arguments);
  };
}();

var mountVolumesAnyway = function () {
  var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(volumes, mounts) {
    var unmounted, tasks;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            unmounted = volumes.filter(function (vol) {
              return volumeMount(vol, mounts) === undefined;
            });
            tasks = unmounted.map(function (vol) {
              return mountVolumeAnyway(vol.uuid, uuidToMountpoint(vol.uuid), vol.missing ? 'degraded,ro' : null);
            });
            _context8.next = 4;
            return _promise2.default.all(tasks);

          case 4:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function mountVolumesAnyway(_x5, _x6) {
    return _ref8.apply(this, arguments);
  };
}();

var probeUsages = function () {
  var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(mounts) {
    var filtered;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            filtered = mounts.filter(function (mnt) {
              return mnt.fs_type === 'btrfs' && mnt.mountpoint.startsWith('/run/wisnuc/volumes/') && !mnt.mountpoint.endsWith('/graph/btrfs');
            });
            _context9.next = 3;
            return _promise2.default.all(filtered.map(function (mnt) {
              return probeUsage(mnt.mountpoint);
            }));

          case 3:
            return _context9.abrupt('return', _context9.sent);

          case 4:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function probeUsages(_x7) {
    return _ref9.apply(this, arguments);
  };
}();

var probeStorageWithUsages = function () {
  var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
    var storage, mounts, usages;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return probeStorage();

          case 2:
            storage = _context10.sent;
            _context10.next = 5;
            return mountVolumesAnyway(storage.volumes, storage.mounts);

          case 5:
            _context10.next = 7;
            return probeMounts();

          case 7:
            mounts = _context10.sent;
            _context10.next = 10;
            return probeUsages(mounts);

          case 10:
            usages = _context10.sent;
            return _context10.abrupt('return', (0, _assign2.default)({}, storage, { mounts: mounts, usages: usages }));

          case 12:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function probeStorageWithUsages() {
    return _ref10.apply(this, arguments);
  };
}();

var refreshStorage = function () {
  var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
    var obj;
    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return probeStorageWithUsages();

          case 2:
            obj = _context11.sent;

            (0, _reducers.storeDispatch)({
              type: 'STORAGE_UPDATE',
              data: obj
            });

          case 4:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function refreshStorage() {
    return _ref11.apply(this, arguments);
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

var createVolume = function () {
  var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(blknames, opts) {
    var mode, debug, storage, daemon, mps, stdout, blknamesValidation, blknamesMounted;
    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
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

              blknames.forEach(function (blkname) {

                // find corresponding block (object)
                var block = blocks.find(function (blk) {
                  return blk.props.devname === blkname;
                });

                if (!block) throw new InvalidError(blkname + ' not found');
                if (block.props.devtype !== 'disk') throw new InvalidError(blkname + ' is not a disk');
                if (block.props.id_bus !== 'ata' && block.props.id_bus !== 'scsi') throw new InvalidError(blkname + ' is not ata disk');

                // check if the block belongs to a volume
                var volume = blockVolume(block, volumes);
                if (volume) {
                  if (daemon.running && daemon.volume === volume.uuid) throw new InvalidError(blkname + ' is a device of running app engine volume, stop app engine before proceeding');
                  var mnt = volumeMount(volume, mounts);
                  if (mnt && mnt.mountpoint === '/') throw new InvalidError(blkname + ' is a device of system volume');
                } else {
                  var parts = blockPartitions(block, blocks);
                  parts.forEach(function (part) {
                    var mnt = blockMount(part, volumes, mounts);
                    if (mnt && mnt.mountpoint === '/') throw new InvalidError(blkname + ' contains root partition ' + part.devname);
                    if (swaps.find(function (swap) {
                      return swap.filename === part.devname;
                    })) throw new InvalidError(blkname + ' contains swap partition ' + part.devname);
                  });
                }
              });
            };

            info('createVolume');
            info('blknames: ' + blknames.join(','));

            mode = opts.mode;

            if (mode === undefined) mode = 'single';

            if (!(mode !== 'single' && mode !== 'raid0' && mode !== 'raid1')) {
              _context12.next = 8;
              break;
            }

            return _context12.abrupt('return', new Error('invalid mode, only single, raid0, raid1 are supported'));

          case 8:
            debug = true;

            if (blknames.length) {
              _context12.next = 11;
              break;
            }

            throw new InvalidError('device names empty');

          case 11:

            // undupe
            blknames = blknames.filter(function (blkname, index, self) {
              return index === self.indexOf(blkname);
            });

            // probe storage
            _context12.next = 14;
            return probeStorage();

          case 14:
            storage = _context12.sent;
            _context12.next = 17;
            return (0, _docker.probeDaemon)();

          case 17:
            daemon = _context12.sent;

            if (!(storage.blocks === null)) {
              _context12.next = 20;
              break;
            }

            return _context12.abrupt('return');

          case 20:
            if (!(storage.blocks.length === 0)) {
              _context12.next = 22;
              break;
            }

            return _context12.abrupt('return');

          case 22:

            // validate
            blknamesValidation(blknames, storage.blocks, storage.volumes, storage.mounts, storage.swaps, daemon);

            // find mounted mountpoints
            mps = blknamesMounted(blknames, storage.blocks, storage.volumes, storage.mounts);

            info('blknames mounted: ' + mps.join(' '));

            // umount mounted
            _context12.next = 27;
            return _promise2.default.all(mps.map(function (mp) {
              return new _promise2.default(function (resolve, reject) {
                child.exec('umount ' + mp, function (err, stdout, stderr) {
                  return err ? reject(err) : resolve(stdout);
                });
              });
            }));

          case 27:

            info('unmount mounted blknames successfully');

            _context12.next = 30;
            return new _promise2.default(function (resolve, reject) {
              child.exec('mkfs.btrfs -d ' + mode + ' -f ' + blknames.join(' '), function (err, stdout, stderr) {
                err ? reject(err) : resolve(stdout);
              });
            });

          case 30:
            stdout = _context12.sent;


            info('mkfs.btrfs successfully');

            _context12.next = 34;
            return probeStorageWithUsages();

          case 34:
            storage = _context12.sent;
            return _context12.abrupt('return', storage.volumes.find(function (vol) {
              return vol.devices.length === blknames.length && vol.devices.every(function (dev) {
                return blknames.find(function (bn) {
                  return bn === dev.path;
                });
              });
            }));

          case 36:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function createVolume(_x8, _x9) {
    return _ref12.apply(this, arguments);
  };
}();

var testOperation = function () {
  var _ref13 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee13() {
    return _regenerator2.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            return _context13.abrupt('return', new _promise2.default(function (resolve, reject) {
              setTimeout(function () {
                console.log('test operation timeout (deliberately)');
                resolve('hello');
              }, 3000);
            }));

          case 1:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function testOperation() {
    return _ref13.apply(this, arguments);
  };
}();

var mkfsBtrfsOperation = function () {
  var _ref14 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee14(arg) {
    var opts, blknames;
    return _regenerator2.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            opts = { mode: arg.mode };
            blknames = arg.blknames;
            _context14.next = 4;
            return createVolume(blknames, opts);

          case 4:
            _context14.next = 6;
            return refreshStorage();

          case 6:
            return _context14.abrupt('return', {});

          case 7:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, this);
  }));

  return function mkfsBtrfsOperation(_x10) {
    return _ref14.apply(this, arguments);
  };
}();

var _operation = function () {
  var _ref15 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee15(req) {
    var f, args;
    return _regenerator2.default.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            f = void 0, args = void 0;

            if (!(req && req.operation)) {
              _context15.next = 13;
              break;
            }

            info('operation: ' + req.operation);

            args = req.args && Array.isArray(req.args) ? req.args : [];
            _context15.t0 = req.operation;
            _context15.next = _context15.t0 === 'test' ? 7 : _context15.t0 === 'mkfs_btrfs' ? 9 : 11;
            break;

          case 7:
            f = testOperation;
            return _context15.abrupt('break', 13);

          case 9:
            f = mkfsBtrfsOperation;
            return _context15.abrupt('break', 13);

          case 11:
            info('operation: ' + req.operation + ' is not implemented');
            return _context15.abrupt('break', 13);

          case 13:
            if (!f) {
              _context15.next = 16;
              break;
            }

            _context15.next = 16;
            return f.apply(undefined, (0, _toConsumableArray3.default)(args));

          case 16:
            return _context15.abrupt('return', { errno: 0 });

          case 17:
          case 'end':
            return _context15.stop();
        }
      }
    }, _callee15, this);
  }));

  return function _operation(_x11) {
    return _ref15.apply(this, arguments);
  };
}();

var _utils = require('./utils');

var _reducers = require('../lib/reducers');

var _docker = require('../lib/docker');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var child = require('child_process');

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

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(InvalidError).call(this, message));

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

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(OperationFailError).call(this, message));

    _this2.message = message;
    _this2.name = 'OperationFailError';
    return _this2;
  }

  return OperationFailError;
}(Error);

function volumeMount(volume, mounts) {
  return mounts.find(function (mnt) {
    return volume.devices.find(function (dev) {
      return dev.path === mnt.device;
    });
  });
}

function blockVolume(block, volumes) {
  return volumes.find(function (vol) {
    return vol.devices.find(function (dev) {
      return dev.path === block.props.devname;
    });
  });
}

function blockMount(block, volumes, mounts) {

  var volume = blockVolume(block, volumes);
  return volume ? volumeMount(volume, mounts) : mounts.find(function (mnt) {
    return mnt.device === block.props.devname;
  });
}

function blockPartitions(block, blocks) {

  return blocks.filter(function (blk) {
    blk.props.devtype === 'partition' && blk.sysfsProps[1].path === block.props.devpath;
  });
}

function uuidToMountpoint(uuid) {
  return '/run/wisnuc/volumes/' + uuid;
}

exports.default = {

  init: function init() {
    /** one-shot initialization **/
    refreshStorage().then(function (r) {
      info('initialized successfully');
    }).catch(function (e) {
      info('ERROR: init fails, errno: ' + e.errno + ', ' + e.message);
    });
  },

  operation: function operation(req, callback) {
    return _operation(req).then(function (r) {
      return callback(null, r);
    }).catch(function (e) {
      return callback(e);
    });
  }
};
exports.mkfsBtrfsOperation = mkfsBtrfsOperation;