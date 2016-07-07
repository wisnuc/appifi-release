'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveConfig = exports.readConfig = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var readConfig = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve) {
              // never reject

              _fs2.default.readFile(configFilePath, function (err, data) {

                var def = { lastUsedVolume: null };
                if (err) {
                  info('WARNING: error reading docker config file, using default');
                  resolve(def);
                } else {
                  try {
                    var r = JSON.parse(data.toString());
                    resolve(r);
                  } catch (e) {
                    info('WARNING: error parsing docker config file, using default');
                    info(data.toString());
                    resolve(def);
                  }
                }
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function readConfig() {
    return _ref.apply(this, arguments);
  };
}();

var saveConfig = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(config) {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt('return', new _promise2.default(function (resolve) {
              // never reject

              _fs2.default.writeFile(configFilePath, (0, _stringify2.default)(config, null, '  '), function (err) {
                if (err) console.log(err);
                resolve();
              });
            }));

          case 1:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function saveConfig(_x) {
    return _ref2.apply(this, arguments);
  };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var configFilePath = '/etc/wisnuc.json';

var info = function info(text) {
  return console.log('[docker config] ' + text);
};

exports.readConfig = readConfig;
exports.saveConfig = saveConfig;