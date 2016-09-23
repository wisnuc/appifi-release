'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.containerDelete = exports.containerCreate = exports.containerStop = exports.containerStart = undefined;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

// return err

var containerStart = function () {
  var _ref = (0, _bluebird.method)(function (id) {

    return new _bluebird2.default(function (resolve, reject) {
      return _superagent2.default.post(dockerUrl + '/containers/' + id + '/start').set('Accept', 'application/json').end(function (err, res) {
        if (err) return resolve(err);

        /*  see api doc, v1.23
            204 no error
            304 container already started
            404 no such container
            500 server error */

        if (res.statusCode === 204 || res.statusCode === 304) return resolve(null);

        resolve(new _error.HttpStatusError(res.statusCode));
      });
    });
  });

  return function containerStart(_x) {
    return _ref.apply(this, arguments);
  };
}();

// return err


var containerStop = function () {
  var _ref2 = (0, _bluebird.method)(function (id) {

    return new _bluebird2.default(function (resolve, reject) {
      return _superagent2.default.post(dockerUrl + '/containers/' + id + '/stop').set('Accept', 'application/json').end(function (err, res) {

        if (err) return resolve(err);

        /*  see api doc, v1.23
            204 no error
            304 container already started
            404 no such container
            500 server error */

        if (res.statusCode === 204 || res.statusCode === 304) return resolve(null);

        resolve(new _error.HttpStatusError(res.statusCode));
      });
    });
  });

  return function containerStop(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

// return err


var containerCreate = function () {
  var _ref3 = (0, _bluebird.method)(function (option) {

    return new _bluebird2.default(function (resolve, reject) {
      _superagent2.default.post(dockerUrl + '/containers/create').set('Accept', 'application/json').send(option).end(function (err, res) {
        if (err) {
          resolve(err);
        } else {
          resolve(res.body);
        }
      });
    });
  });

  return function containerCreate(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

// return err


var containerDelete = function () {
  var _ref4 = (0, _bluebird.method)(function (id) {

    return new _bluebird2.default(function (resolve, reject) {
      _superagent2.default.del(dockerUrl + '/containers/' + id + '?force=true').end(function (err, res) {

        if (err) return resolve(err);

        /* api doc
          204 no error
          400 bad parameter
          404 no such container
          500 server error */

        if (res.statusCode === 204) return resolve(null);
        resolve(new _error.HttpStatusError(res.statusCode));
      });
    });
  });

  return function containerDelete(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _error = require('../lib/error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dockerUrl = 'http://127.0.0.1:1688';exports.containerStart = containerStart;
exports.containerStop = containerStop;
exports.containerCreate = containerCreate;
exports.containerDelete = containerDelete;