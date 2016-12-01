'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _express = require('express');

var _reducers = require('../../reducers');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:routes:drives');
var router = (0, _express.Router)();

/**

Drive {
 domain: null,
 _events: [Object],
 _eventsCount: 1,
 _maxListeners: undefined,
 proto: [Object],
 uuidMap: [Object],
 hashMap: [Object],
 hashless: [Object],
 shares: [Object],
 root: [Object],
 uuid: '6586789e-4a2c-4159-b3da-903ae7f10c2a',
 owner: [Object],
 writelist: [],
 readlist: [],
 fixedOwner: true,
 cacheState: 'CREATED',
 rootpath: '/home/wisnuc/fruitmix/tmptest/drives/6586789e-4a2c-4159-b3da-903ae7f10c2a' } ],

**/

// router.get('/', auth.jwt(), (req, res) => {
router.get('/', function (req, res) {

  var blocks = (0, _reducers.storeState)().storage.blocks;
  console.log(blocks.filter(function (blk) {
    return blk.stats.isMounted;
  }));

  var repo = _models2.default.getModel('repo');
  return res.status(200).json(repo.getDrives());
});

// for filesystem
// type === filesystem
// name === block name such as sda
// path === relative path to sda mountpoint
// 
// filesystem must be mounted
// filesystem must not be roofs
// if the filesystem containing current wisnuc instance, path must not be starting with /wsinc
//   if path is '/', then result should filter out wisnuc folder
router.get('/list', function (req, res) {

  debug('list, req.query', req.query);

  var _req$query = req.query,
      type = _req$query.type,
      name = _req$query.name;

  var qpath = req.query.path;

  if (type === 'filesystem') {
    var _ret = function () {

      if (typeof name !== 'string' || typeof qpath !== 'string') return {
          v: res.status(400).json({ message: 'name and path must be string' })
        };

      var blocks = (0, _reducers.storeState)().storage.blocks;
      var block = blocks.find(function (blk) {
        return blk.name === name;
      });

      if (!block) return {
          v: res.status(404).json({ message: 'block ' + name + ' not found' })
        };

      if (!block.stats.isFileSystem) return {
          v: res.status(400).json({ message: 'block is not a filesystem' })
        };

      debug('list, block', block);
      if (!block.stats.isMounted) return {
          v: res.status(400).json({ message: 'block ' + name + ' not mounted' })
        };

      debug('list, block.stats.mountpoint', block.stats.mountpoint);
      if (block.stats.mountpoint === '/') return {
          v: res.status(400).json({ message: 'block ' + name + ' is rootfs' })
        };

      var mp = block.stats.mountpoint;

      // end mp with a single '/'
      mp = mp.endsWith('/') ? mp : mp + '/';
      // no leading '/' for qpath
      while (qpath.startsWith('/')) {
        qpath = qpath.slice(1);
      }var abspath = _path2.default.join(mp, qpath);

      debug('list, mp and abspath', mp, abspath);

      if (!abspath.startsWith(mp)) // invalid path
        return {
          v: res.status(400).json({ message: 'invalid path ' + query.path })
        };

      _fs2.default.readdir(abspath, function (err, entries) {
        if (err) return res.status(500).json({ code: err.code, message: err.message });

        if (entries.length === 0) return res.status(200).json([]);

        var count = entries.length;
        var list = [];
        entries.forEach(function (entry) {
          _fs2.default.lstat(_path2.default.join(abspath, entry), function (err, stat) {
            if (!err) {
              if (stat.isDirectory() || stat.isFile()) {
                list.push({
                  name: entry,
                  type: stat.isDirectory() ? 'folder' : 'file',
                  size: stat.size,
                  mtime: stat.mtime
                });
              }
            }
            if (! --count) {
              res.status(200).json(list);
            }
          });
        });
      });
    }();

    if ((typeof _ret === 'undefined' ? 'undefined' : (0, _typeof3.default)(_ret)) === "object") return _ret.v;
  } else if (type === 'appifi') {} else return res.status(400).json({
    message: 'unrecognized type'
  });
});

exports.default = router;