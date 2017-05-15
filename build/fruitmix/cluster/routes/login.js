'use strict';

var router = require('express').Router();

var _require = require('../model'),
    localUsers = _require.localUsers;

router.get('/', function (req, res) {

  localUsers(function (err, users) {

    if (err) {
      return res.status(500).json({
        err: {
          code: err.code,
          message: err.message
        }
      });
    }

    res.status(200).json(users.map(function (u) {
      return {
        uuid: u.uuid,
        username: u.username,
        avatar: u.avatar,
        unixUID: u.unixuid
      };
    }));
  });
});

module.exports = router;