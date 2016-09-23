'use strict';

var router = require('express').Router();
var passport = require('passport');

router.get('/basic', passport.authenticate('basic', { session: false }), function (req, res) {
  res.send('auth test basic');
});

router.get('/jwt', passport.authenticate('jwt', { session: false }), function (req, res) {
  res.send('auth test jwt');
});

module.exports = router;