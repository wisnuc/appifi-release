'use strict';

var fs = require('fs');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var xattr = require('fs-xattr');
var Promise = require('bluebird');

Promise.promisifyAll(fs);
Promise.promisifyAll(xattr);

var mkdirpAsync = Promise.promisify(mkdirp);
var rimrafAsync = Promise.promisify(rimraf);

module.exports = { mkdirp: mkdirp, mkdirpAsync: mkdirpAsync, rimraf: rimraf, rimrafAsync: rimrafAsync };