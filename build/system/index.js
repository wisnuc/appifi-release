'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _reducers = require('../appifi/lib/reducers');

var _sysconfig = require('./sysconfig');

var _sysconfig2 = _interopRequireDefault(_sysconfig);

var _mir = require('./mir');

var _mir2 = _interopRequireDefault(_mir);

var _ipaliasing = require('./ipaliasing');

var _eth = require('./eth');

var _eth2 = _interopRequireDefault(_eth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:router');

var codeMap = new _map2.default([['EINVAL', 400], ['ENOENT', 404]]);

var router = _express2.default.Router();

var K = function K(x) {
  return function (y) {
    return x;
  };
};
var respond = function respond(res, err, obj) {
  return err ? res.status(codeMap.get(err.code) || 500).json({ code: err.code, message: err.message }) : res.status(200).json(obj === null || obj === undefined ? { message: 'success' } : obj);
};

var timedate = function timedate(callback) {
  return _child_process2.default.exec('timedatectl', function (err, stdout, stderr) {
    return err ? callback(err) : callback(null, stdout.toString().split('\n').filter(function (l) {
      return l.length;
    }).reduce(function (prev, curr) {
      var pair = curr.split(': ').map(function (str) {
        return str.trim();
      });
      prev[pair[0]] = pair[1];
      return prev;
    }, {}));
  });
};

// timedate
router.get('/timedate', function (req, res) {
  return timedate(function (err, obj) {
    return err ? K(res.status(500).end())(console.log(err)) : res.status(200).json(obj);
  });
});

// network
router.get('/net', function (req, res) {
  return (0, _eth2.default)().asCallback(function (err, obj) {
    return err ? K(res.status(500).end())(console.log(err)) : res.status(200).json(obj);
  });
});

// aliasing
router.get('/ipaliasing', function (req, res) {
  return res.status(200).json((0, _ipaliasing.aliases)());
});

router.post('/ipaliasing', function (req, res) {
  return (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var _req$body, mac, ipv4, existing, dev;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _req$body = req.body, mac = _req$body.mac, ipv4 = _req$body.ipv4;

            if (!(typeof mac !== 'string' || !_validator2.default.isMACAddress(mac))) {
              _context.next = 3;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid mac'), { code: 'EINVAL' });

          case 3:
            if (!(typeof ipv4 !== 'string' || !_validator2.default.isIP(ipv4, 4))) {
              _context.next = 5;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid ipv4'), { code: 'EINVAL' });

          case 5:
            existing = (0, _ipaliasing.aliases)().find(function (alias) {
              return alias.mac === mac;
            });

            if (!existing) {
              _context.next = 9;
              break;
            }

            _context.next = 9;
            return (0, _ipaliasing.deleteAliasAsync)(existing.dev, existing.ipv4);

          case 9:
            dev = (0, _ipaliasing.mac2dev)(mac);

            if (dev) {
              _context.next = 12;
              break;
            }

            throw (0, _assign2.default)(new Error('no interface found with given mac'), { code: 'ENOENT' });

          case 12:
            _context.next = 14;
            return (0, _ipaliasing.addAliasAsync)(dev, ipv4);

          case 14:
            return _context.abrupt('return', (0, _ipaliasing.aliases)().find(function (alias) {
              return alias.mac === mac;
            }));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }))().asCallback(function (err, obj) {
    return respond(res, err, obj);
  });
});

router.delete('/ipaliasing', function (req, res) {
  return (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var _req$body2, mac, ipv4, existing;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _req$body2 = req.body, mac = _req$body2.mac, ipv4 = _req$body2.ipv4;

            if (!(typeof mac !== 'string' || !_validator2.default.isMACAddress(mac))) {
              _context2.next = 3;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid mac'), { code: 'EINVAL' });

          case 3:
            if (!(typeof ipv4 !== 'string' || !_validator2.default.isIP(ipv4, 4))) {
              _context2.next = 5;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid ipv4'), { code: 'EINVAL' });

          case 5:
            existing = (0, _ipaliasing.aliases)().find(function (alias) {
              return alias.mac === mac;
            });

            console.log(existing);

            if (!existing) {
              _context2.next = 10;
              break;
            }

            _context2.next = 10;
            return (0, _ipaliasing.deleteAliasAsync)(existing.dev, existing.ipv4);

          case 10:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }))().asCallback(function (err, obj) {
    return respond(res, err, obj);
  });
});

// fan
router.get('/fan', function (req, res) {});

router.post('/fan', function (req, res) {
  var scale = req.body.scale;
});

router.use('/storage', _mir2.default);
router.use('/mir', _mir2.default);

router.get('/boot', function (req, res) {

  var sysboot = (0, _reducers.storeState)().sysboot;

  debug(sysboot);

  if (sysboot) res.status(200).json(sysboot);else res.status(500).end(); // TODO
});

exports.default = router;