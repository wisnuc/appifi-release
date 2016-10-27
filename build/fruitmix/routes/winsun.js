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

var _express = require('express');

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _paths = require('../lib/paths');

var _paths2 = _interopRequireDefault(_paths);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _winsun = require('../lib/winsun');

var _winsun2 = _interopRequireDefault(_winsun);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

router.get('/', function (req, res) {

  var fruit = _paths2.default.get('root');
  var vroot = _path2.default.resolve(fruit, '../..');
  (0, _winsun2.default)(vroot, function (err, nodes) {
    if (err) return res.status(500).end();
    res.status(200).json(nodes);
  });
});

var renameIfExists = function renameIfExists(list, name) {

  if (list.indexOf(name) === -1) return name;

  var i = 0;
  var newname = void 0;
  do {
    i++;
    newname = name + ' (' + i.toString() + ')';
  } while (list.indexOf(newname) !== -1);

  return newname;
};

router.post('/', function (req, res) {

  var fruit = _paths2.default.get('root');
  var vroot = _path2.default.resolve(fruit, '..', '..');

  var repo = _models2.default.getModel('repo');
  var filer = _models2.default.getModel('filer');
  var user = req.user;

  /**
  {
    src: 'a name, or nobody/name',
    dst: a drive uuid
  }
  **/

  var validateSrc = function validateSrc(src) {

    console.log('src is ' + src);

    if (typeof src !== 'string') return false;
    var test = void 0;
    test = src.startsWith('nobody/') ? src.slice('nobody/'.length) : src;
    if (test.length === 0 || test.split('/').length > 1) return false;
    return true;
  };

  var validateDst = function validateDst(dst) {
    if (typeof dst === 'string' && _validator2.default.isUUID(dst)) return true;
    return false;
  };

  if (!req.body || (0, _typeof3.default)(req.body) !== 'object') return res.status(500).end();

  var _req$body = req.body,
      src = _req$body.src,
      dst = _req$body.dst;


  if (!validateSrc(src) || !validateDst(dst)) return res.status(500).end();

  var node = filer.findNodeByUUID(dst);
  if (!node || !node.isDirectory()) return res.status(500).end();

  var dstDirPath = node.namepath();
  var dstname = src.startsWith('nobody/') ? src.slice('nobody/'.length) : src;

  _fs2.default.readdir(dstDirPath, function (err, entries) {

    if (err) return res.status(500).end();
    dstname = renameIfExists(entries, dstname);

    var srcpath = _path2.default.join(vroot, src);
    var dstpath = _path2.default.join(dstDirPath, dstname);

    console.log('**** moving ' + srcpath + ' to ' + dstpath + ' ****');
    _fs2.default.rename(srcpath, dstpath, function (err) {

      if (err) return res.status(500).end();
      repo.inspect(node.uuid);
      setTimeout(function () {
        return res.status(200).end();
      }, 3000);
    });
  });
});

exports.default = router;