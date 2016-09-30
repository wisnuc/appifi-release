'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = require('express').Router();
var auth = require('../middleware/auth').default;
var uuid = require('node-uuid');
var url = require('url');
var spawnSync = require('child_process').spawnSync;

router.get('/', auth.jwt(), function (req, res) {

  var user = req.user;
  var userList = _models2.default.getModel('user').collection.list;

  if (user.isAdmin) {
    var list = _models2.default.getModel('user').collection.list;
    return res.status(200).json(list.map(function (u) {
      return (0, _assign2.default)({}, u, {
        password: undefined,
        smbPassword: undefined,
        smbLastChangeTime: undefined
      });
    }));
  } else {
    return res.status(200).json([(0, _assign2.default)({}, user, {
      password: undefined,
      smbPassword: undefined,
      smbLastChangeTime: undefined
    })]);
  }
});

router.post('/', auth.jwt(), function (req, res) {

  var user = req.user;
  var userModel = _models2.default.getModel('user');

  if (!user.isAdmin) {
    return res.status(401).json({});
  }

  var props = (0, _assign2.default)({}, req.body, {
    type: 'local'
  });

  // create user
  userModel.createUser(props, function (err, newUser) {

    if (err) return res.status(500).json({
      code: err.code,
      message: err.message
    });

    var repo = _models2.default.getModel('repo');
    repo.createUserDrives(newUser, function () {
      res.status(200).json((0, _assign2.default)({}, newUser, {
        password: undefined,
        smbPassword: undefined,
        smbLastChangeTime: undefined
      }));
    });
  });
});

router.patch('/:userUUID', auth.jwt(), function (req, res) {

  var user = req.user;
  var userModel = _models2.default.getModel('user');
  var userUUID = req.params.userUUID;

  if (!user.isAdmin && userUUID !== user.uuid) {
    return res.status(401).json({});
  }

  var props = (0, _assign2.default)({}, req.body);

  userModel.updateUser(userUUID, props, function (err, user) {

    if (err) return res.status(500).json({
      code: err.code,
      message: err.message
    });

    return res.status(200).json((0, _assign2.default)({}, user, {
      password: undefined,
      smbPassword: undefined,
      smbLastChangeTime: undefined
    }));
  });
});

/**
router.post('/',auth.jwt(), (req, res) => {
  if (req.user.isAdmin === true ) {
    var tmpuuid=uuid.v4()
    var newuser = new User({
      uuid: tmpuuid,
      username: req.body.username,
      password: req.body.password,
      avatar: 'defaultAvatar.jpg',
      isAdmin: req.body.isAdmin,
      email:req.body.email,
      isFirstUser: false,
      type: 'user',
    })
    newuser.save((err) => {
      if (err) { return res.status(500).json(err) }
      spawnSync('mkdir',['-p','/data/fruitmix/drive/'+tmpuuid])
      let fm={}
      fm.owner=tmpuuid
      xattr.setSync('/data/fruitmix/drive/'+tmpuuid,'user.fruitmix',fm)
      xattr.setSync('/data/fruitmix/drive/'+tmpuuid,'user.owner',tmpuuid)
      builder.checkall('/data/fruitmix/drive/'+tmpuuid)
      return res.status(200).json(newuser)
    })
  }
  else{
    return res.status(403).json('403 Permission denied')
  }
})
**/

router.delete('/', auth.jwt(), function (req, res) {
  if (req.user.isAdmin === true) {
    if (!req.body.uuid) {
      return res.status(400).json('uuid is missing');
    }
    User.remove({ uuid: req.body.uuid }, function (err) {
      if (err) {
        return res.status(500).json(null);
      }
      return res.status(200).json(null);
    });
  } else {
    return res.status(403).json('403 Permission denied');
  }
});

router.patch('/', auth.jwt(), function (req, res) {
  if (req.user.isAdmin === true) {
    if (!req.body.uuid) {
      return res.status(400).json('uuid is missing');
    }
    User.update({ uuid: req.body.uuid }, { $set: { username: req.body.username, isAdmin: req.body.isAdmin, password: req.body.password } }, function (err) {
      if (err) {
        return res.status(500).json(null);
      }
      return res.status(200).json(null);
    });
  } else {
    return res.status(403).json('403 Permission denied');
  }
});

module.exports = router;

/*
import { Router } from 'express'
import Models from '../models/models'

const router = Router()


router.get('/', (req, res) => {
  //console.log(UserModel.data.collection.list);
  let r = UserModel.data.collection.list.reduce((pre, cur) => pre.concat([{'uuid':cur.uuid, 'avatar':cur.avatar==null?'':cur.avatar, 'email':cur.email, 'username':cur.username}]), [])
  //res.status(200).end()
  res.status(200).json(r)
})

router.post('/', (req, res) => {

  UserModel.data.createUser(req.body) 
    .then(() => { res.status(200).end()})
    .catch(e => { res.status(e.code === 'EINVAL' ? 400 : 500).json({
      code: e.code,
      message: e.message
    })})
  })

router.delete('/', (req, res) => {
  //console.log('MMM '+req.body.uuid);
  UserModel.data.deleteUser(req.body.uuid) 
  .then(() => { 
    //console.log(UserModel.data.collection.list);
    res.status(200).end()
  })
})


export default router
*/