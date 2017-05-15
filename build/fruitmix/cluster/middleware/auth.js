'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

var _passportHttp = require('passport-http');

var _passportJwt = require('passport-jwt');

var _passportJwt2 = require('../../config/passportJwt');

var _model = require('../model');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import models from '../models/models'
var httpBasicVerify = function httpBasicVerify(userUUID, password, done) {

  (0, _model.localUsers)(function (err, users) {
    if (err) return done(err);

    var user = users.find(function (user) {
      return user.uuid === userUUID;
    });
    if (!user) return done(new Error('user not found'));

    _bcrypt2.default.compare(password, user.password, function (err, match) {
      if (err) return done(err);
      match ? done(null, user) : done(null, false);
    });
  });
};

var jwtOpts = {
  secretOrKey: _passportJwt2.secret,
  jwtFromRequest: _passportJwt.ExtractJwt.fromAuthHeader()
};

var jwtVerify = function jwtVerify(jwt_payload, done) {
  (0, _model.localUsers)(function (e, users) {
    if (e) return done(e);
    var user = users.find(function (u) {
      return u.uuid === jwt_payload.uuid;
    });
    user ? done(null, user) : done(null, false);
  });
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