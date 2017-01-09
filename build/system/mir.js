'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

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

var _reducers = require('../reducers');

var _mkfs = require('./mkfs');

var _boot = require('./boot');

var _adapter = require('./adapter');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:mir');
var router = _express2.default.Router();

var runnable = function runnable(wisnuc) {
  return (typeof wisnuc === 'undefined' ? 'undefined' : (0, _typeof3.default)(wisnuc)) === 'object' && wisnuc !== null && wisnuc.users;
};

router.get('/', function (req, res) {

  var storage = (0, _reducers.storeState)().storage;
  if (!storage) return res.status(500).end();

  if (req.query.raw === 'true') return res.status(200).json(storage);

  var adapted = (0, _adapter.adaptStorage)(storage);
  if (req.query.wisnuc === 'true') (0, _adapter.probeAllFruitmixes)(adapted, function (err, copy) {
    return err ? res.status(500).json({ message: err.message }) : res.status(200).json(copy);
  });else res.status(200).json(adapted);
});

//
// target: <file system uuid>
//
router.post('/run', function (req, res) {

  debug('run', req.body);

  var bstate = (0, _reducers.storeState)().boot;
  if (bstate.state !== 'maintenance') return res.status(400).json({ message: '系统未处于维护模式' });

  if ((0, _typeof3.default)(req.body) !== 'object' || req.body === null || typeof req.body.target !== 'string' || !_validator2.default.isUUID(req.body.target)) return res.status(400).json({ code: 'EINVAL', message: '非法参数' });

  var adapted = (0, _adapter.adaptStorage)((0, _reducers.storeState)().storage);
  var volume = adapted.volumes.find(function (vol) {
    return vol.fileSystemUUID === req.body.target;
  });

  if (!volume) return res.status(400).json({ message: 'volume not found' });
  if (!volume.isMounted) return res.status(400).json({ message: 'volume not mounted' });
  if (volume.isMissing) return res.status(400).json({ message: 'volume has missing device' });

  (0, _adapter.probeFruitmix)(volume.mountpoint, function (err, wisnuc) {

    debug('probe fruitmix', err || wisnuc);

    if (err) return res.status(500).json({ message: err.message });

    debug('run, wisnuc', wisnuc);

    if (!runnable(wisnuc)) return res.status(400).json({ message: 'wisnuc not runnable', code: wisnuc.error });

    (0, _boot.fakeReboot)({ type: 'btrfs', uuid: req.body.target }, function (err, boot) {
      return err ? res.status(500).json({ message: err.mesage }) : res.status(200).json({ boot: boot });
    });
  });
});

//
// target: uuid (file system uuid)
// remove: 'wisnuc' or 'fruitmix' or undefined
//
router.post('/init', function (req, res) {

  debug('init', req.body);

  var bstate = (0, _reducers.storeState)().boot;
  if (bstate.state !== 'maintenance') return res.status(400).json({ message: '系统未处于维护模式' });

  if ((0, _typeof3.default)(req.body) !== 'object' || req.body === null || typeof req.body.target !== 'string' || !_validator2.default.isUUID(req.body.target) || typeof req.body.username !== 'string' || req.body.username.length === 0 || typeof req.body.password !== 'string' || req.body.password.length === 0 || req.body.remove !== undefined && req.body.remove !== 'wisnuc' && req.body.remove !== 'fruitmix') return res.status(400).json({ code: 'EINVAL', message: '非法参数' });

  var _req$body = req.body,
      target = _req$body.target,
      username = _req$body.username,
      password = _req$body.password,
      remove = _req$body.remove;


  var adapted = (0, _adapter.adaptStorage)((0, _reducers.storeState)().storage);
  var filesystems = [].concat((0, _toConsumableArray3.default)(adapted.volumes), (0, _toConsumableArray3.default)(adapted.blocks.filter(function (blk) {
    return blk.isFileSystem && !blk.isVolumeDevice;
  })));

  var fsys = filesystems.find(function (f) {
    return f.fileSystemUUID === target;
  });
  if (!fsys) return res.status(400).json({ message: 'file system not found' });

  if (!fsys.isBtrfs && !fsys.isExt4) return res.status(400).json({ message: 'only btrfs and ext4 is supported' });

  if (fsys.isBtrfs && fsys.isMissing) return res.status(400).json({ message: 'btrfs volume has missing device' });

  if (!fsys.isMounted) return res.status(400).json({ message: 'failed to mount file system' });

  var mp = fsys.mountpoint;

  (0, _adapter.initFruitmix)({ mp: mp, username: username, password: password, remove: remove }, function (err, user) {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: err.message });
    }
    return res.status(200).json(user);
  });
});

/**
  {
    type: 'btrfs'
    target: ['sda', 'sdb'...], device name
    mode: single, raid0, raid1
  }
  {
    type: 'ext4' or 'ntfs'
    target: 'sda', 'sda1', device name
  }
**/
router.post('/mkfs', function (req, res) {

  debug('mkfs', req.body);

  var bstate = (0, _reducers.storeState)().boot;
  if (bstate.state !== 'maintenance') return res.status(400).json({ message: '系统未处于维护模式' });

  if ((0, _typeof3.default)(req.body) !== 'object' || req.body === null || ['btrfs', 'ext4', 'ntfs'].indexOf(req.body.type) === -1) return res.status(400).json({ code: 'EINVAL', message: '非法参数' });

  var _req$body2 = req.body,
      type = _req$body2.type,
      target = _req$body2.target,
      mode = _req$body2.mode;

  if (type !== 'btrfs') return res.status(400).json({ message: 'not supported yet' });

  (0, _mkfs.mkfsBtrfs)(target, mode, function (err, volume) {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: err.message });
    }
    return res.status(200).json(volume);
  });
});

exports.default = router;