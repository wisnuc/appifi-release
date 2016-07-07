'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.containerDelete = exports.containerCreate = exports.containerStop = exports.containerStart = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

// return err

var containerStart = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(id) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
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
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function containerStart(_x) {
    return _ref.apply(this, arguments);
  };
}();

// return err


var containerStop = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(id) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', new _promise2.default(function (resolve, reject) {
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
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function containerStop(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

// return err


var containerCreate = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(option) {
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt('return', new _promise2.default(function (resolve, reject) {
              _superagent2.default.post(dockerUrl + '/containers/create').set('Accept', 'application/json').send(option).end(function (err, res) {
                if (err) {
                  resolve(err);
                } else {
                  resolve(res.body);
                }
              });
            }));

          case 1:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function containerCreate(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

// return err


var containerDelete = function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(id) {
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt('return', new _promise2.default(function (resolve, reject) {
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
            }));

          case 1:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

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