'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _passportHttp = require('passport-http');

var _passportJwt = require('passport-jwt');

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _passportJwt2 = require('../config/passportJwt');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var httpBasicVerify = function httpBasicVerify(username, password, done) {

  var users = _models2.default.getModel('user');
  users.verifyPassword(username, password, function (err, user) {

    if (err) return done(err);
    if (user) return done(null, user);
    done(null, false);
  });
};

var jwtOpts = {
  secretOrKey: _passportJwt2.secret,
  jwtFromRequest: _passportJwt.ExtractJwt.fromAuthHeader()
};

var jwtVerify = function jwtVerify(jwt_payload, done) {
  var User = _models2.default.getModel('user');
  var user = User.collection.list.find(function (u) {
    return u.uuid === jwt_payload.uuid;
  });
  user ? done(null, user) : done(null, false);
};

_passport2.default.use(new _passportHttp.BasicStrategy(httpBasicVerify));
_passport2.default.use(new _passportJwt.Strategy(jwtOpts, jwtVerify));

exports.default = {
  init: function init() {
    return _passport2.default.initialize();
  },
  basic: function basic() {
    return _passport2.default.authenticate('basic', { session: false });
  },
  jwt: function jwt() {
    return _passport2.default.authenticate('jwt', { session: false });
  }
};