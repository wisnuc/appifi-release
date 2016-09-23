'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var throwError = exports.throwError = function throwError(text) {
  throw new Error(text);
};

var throwInvalid = exports.throwInvalid = function throwInvalid(text) {
  var e = new Error(text || 'invalid');
  e.code = 'EINVAL';
  throw e;
};

var throwBusy = exports.throwBusy = function throwBusy(text) {
  var e = new Error(text || 'busy');
  e.code = 'EBUSY';
  throw e;
};

var throwOutOfSync = exports.throwOutOfSync = function throwOutOfSync(text) {
  var e = new Error(text || 'out of sync');
  e.code = 'EOUTOFSYNC';
  throw e;
};