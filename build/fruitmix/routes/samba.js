'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = (0, _express.Router)();

/**

  important !!!!

  user uid must be equal or greater than 2000 AND less than 5000 (exclusive)

**/

var userList = function userList() {

  var umod = _models2.default.getModel('user');
  return umod.collection.list.sort(function (a, b) {
    return a.uuid.localeCompare(b.uuid);
  });
};

// xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx <- hyphen and M are removed, then prefixed with letter x
var uuidToUnixName = function uuidToUnixName(uuid) {
  return ['x'].concat((0, _toConsumableArray3.default)(uuid.split('-').map(function (s, i) {
    return i === 2 ? s.slice(1) : s;
  }))).join('');
};

var shareList = function shareList(userList) {

  var umod = _models2.default.getModel('user');
  var dmod = _models2.default.getModel('drive');
  var ulist = umod.collection.list;
  var dlist = dmod.collection.list;

  var shares = [];
  dlist.forEach(function (drive) {

    if (drive.URI !== 'fruitmix') return;

    if (drive.fixedOwner === true) {

      var owner = ulist.find(function (user) {
        return user.home === drive.uuid;
      });
      if (owner) {
        var shareName = drive.uuid.slice(0, 8);
        var sharePath = '/drives/' + drive.uuid;
        var writelist = [owner.uuid].concat((0, _toConsumableArray3.default)(drive.writelist)).sort().filter(function (item, index, array) {
          return !index || item !== array[index - 1];
        }).map(uuidToUnixName);

        var validUsers = [owner.uuid].concat((0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).sort().filter(function (item, index, array) {
          return !index || item !== array[index - 1];
        }).map(uuidToUnixName);

        shares.push({ name: shareName, path: sharePath, writelist: writelist, validUsers: validUsers });
      }
    } else if (drive.fixedOwner === false) {

      var _shareName = drive.uuid.slice(0, 8);
      var _sharePath = '/drives/' + drive.uuid;

      var _writelist = [].concat((0, _toConsumableArray3.default)(drive.owner), (0, _toConsumableArray3.default)(drive.writelist)).sort().filter(function (item, index, array) {
        return !index || item !== array[index - 1];
      }).map(uuidToUnixName);

      var _validUsers = [].concat((0, _toConsumableArray3.default)(drive.owner), (0, _toConsumableArray3.default)(drive.writelist), (0, _toConsumableArray3.default)(drive.readlist)).sort().filter(function (item, index, array) {
        return !index || item !== array[index - 1];
      }).map(uuidToUnixName);

      if (_validUsers.length > 0) {
        shares.push({ name: _shareName, path: _sharePath, writelist: _writelist, validUsers: _validUsers });
      }
    }
  });

  return shares;
};

router.get('/rollover', function (req, res) {

  var umod = _models2.default.getModel('user');
  var dmod = _models2.default.getModel('drive');

  var rollover = umod.hash + ':' + dmod.hash;

  res.status(200).send(rollover);
});

router.get('/conf', function (req, res) {

  var global = '[global]\n' + '  username map = /usernamemap.txt\n' + '  workgroup = WORKGROUP\n' + '  netbios name = SAMBA\n' + '  map to guest = Bad User\n' + '  log file = /var/log/samba/%m\n' + '  log level = 1\n\n';

  var section = function section(share) {
    return '[' + share.name + ']\n' + ( // username or sharename
    '  path = ' + share.path + '\n') + // uuid path
    '  read only = no\n' + '  guest ok = no\n' + '  force user = root\n' + '  force group = root\n' + ('  valid users = ' + share.validUsers.join(', ') + '\n') + ( // valid users
    '  write list = ' + share.writelist.join(', ') + '\n') + // writelist
    '  vfs objects = full_audit\n' + '  full_audit:prefix = %u|%U|%S|%P\n' + '  full_audit:success = mkdir rename rmdir unlink write pwrite \n' + // dont remove write !!!!
    '  full_audit:failure = connect\n' + '  full_audit:facility = LOCAL7\n' + '  full_audit:priority = ALERT\n\n';
  };

  var conf = global;
  shareList().forEach(function (share) {
    return conf += section(share);
  });
  res.status(200).send(conf);
});

router.get('/createUsers', function (req, res) {

  var shebang = '#!/bin/bash\n';

  var line = function line(name, uid) {
    return 'adduser --disabled-password --disabled-login --no-create-home ' + ('--gecos ",,," --uid ' + uid + ' --gid 0 ' + name + '\n');
  };

  var uid = 2000;

  var script = userList().reduce(function (prev, curr) {
    return prev + line(uuidToUnixName(curr.uuid), uid++);
  }, shebang);

  res.status(200).send(script);
});

router.get('/database', function (req, res) {

  var line = function line(username, userid, password, sec) {
    return username + ':' + userid.toString() + ':XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX:' + password.toUpperCase() + ':[U          ]:LCT-' + sec.toString(16).toUpperCase() + ':\n';
  };

  var uid = 2000;
  var database = userList().reduce(function (prev, user) {
    return prev + line(uuidToUnixName(user.uuid), uid++, user.smbPassword, Math.floor(user.lastChangeTime / 1000));
  }, '');

  res.status(200).send(database);
});

router.get('/usernamemap', function (req, res) {

  var map = userList().reduce(function (prev, user) {
    return prev + (uuidToUnixName(user.uuid) + ' = "' + user.username + '"\n');
  }, '');
  res.status(200).send(map);
});

exports.default = router;