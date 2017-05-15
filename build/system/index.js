'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');
var child = require('child_process');
var os = require('os');

var router = require('express').Router();
var validator = require('validator');

var debug = require('debug')('system:index');

var Boot = require('./boot');
var Config = require('./config');
var Device = require('./device');
var Storage = require('./storage');

var _require = require('./barcelona'),
    readFanSpeed = _require.readFanSpeed,
    writeFanScale = _require.writeFanScale;

var eth = require('./eth');

var _require2 = require('./ipaliasing'),
    mac2dev = _require2.mac2dev,
    aliases = _require2.aliases,
    addAliasAsync = _require2.addAliasAsync,
    deleteAliasAsync = _require2.deleteAliasAsync;

var _require3 = require('./mkfs'),
    mkfsBtrfs = _require3.mkfsBtrfs;

var nolog = function nolog(res) {
  return (0, _assign2.default)(res, { nolog: true });
};
var unsupported = function unsupported(res) {
  return res.status(404).json({ code: 'EUNSUPPORTED', message: 'not supported' });
};
var invalid = function invalid(res) {
  return res.status(400).json({ code: 'EINVAL', message: 'invalid api arguments' });
};
var error = function error(res, err) {
  return res.status(500).json({ code: err.code, message: err.message });
};
var ok = function ok(res, obj) {
  return res.status(200).json(obj ? obj : { message: 'ok' });
};

/**
 *  GET /boot, return boot status
 */
router.get('/boot', function (req, res) {

  var obj = (0, _assign2.default)({}, Boot.get(), {
    bootMode: Config.get().bootMode,
    lastFileSystem: Config.get().lastFileSystem,
    fruitmix: Boot.fruitmix ? Boot.fruitmix.getState() : null
  });

  // quick fix, TODO
  if (!obj.currentFileSystem) obj.currentFileSystem = null;

  nolog(res).status(200).json(obj);
});

/**
 *  POST /boot
 *  {
 *    op: STRING_ENUM,      // 'poweroff', 'reboot', 'rebootMaintenance', 'rebootNormal' 
 *    target: STRING_UUID,  // file system uuid, required only if op === 'rebootNormal'
 *  }
 */
var isValidBootArgs = function isValidBootArgs(body) {
  return (typeof body === 'undefined' ? 'undefined' : (0, _typeof3.default)(body)) === 'object' && body !== null && !!['poweroff', 'reboot', 'rebootMaintenance', 'rebootNormal'].includes(body.op) && body.op === 'rebootNormal' ? typeof body.target === 'string' && validator.isUUID(body.target) : true;
};

router.post('/boot', function (req, res) {
  return !isValidBootArgs(req.body) ? invalid(res) : Boot.rebootAsync(req.body.op, req.body.target).asCallback(function (err) {
    return err ? error(res, err) : ok(res);
  });
});

/**
 *  GET /device, return device info 
 */
router.get('/device', function (req, res) {
  return ok(res, Device.get());
});

/**
 *  GET /fan, return { fanSpeed, fanScale }
 */
router.get('/fan', function (req, res) {
  return !Device.isWS215i() ? unsupported(res) : readFanSpeed(function (err, fanSpeed) {
    return err ? error(res, err) : ok(res, { fanSpeed: fanSpeed, fanScale: Config.get().barcelonaFanScale });
  });
});

/**
 *  POST /fan
 *  {
 *    fanScale: INTEGER
 *  }
 */
var isValidFanArgs = function isValidFanArgs(body) {
  return (typeof body === 'undefined' ? 'undefined' : (0, _typeof3.default)(body)) === 'object' && body !== null && Number.isIntegery(body.fanScale) && body.fanScale >= 0 && body.fanScale <= 100;
};

router.post('/fan', function (req, res) {
  return !Device.isWS215i() ? unsupported(res) : !isValidFanArgs(req.body) ? invalid(res) : writeFanScale(req.body.fanScale, function (err) {
    return err ? error(res, err) : ok(res);
  });
});

/**
 *  GET /ipaliasing, return ipaliasing (list)
 */
router.get('/ipaliasing', function (req, res) {
  return res.status(200).json(aliases());
});

/**
 *  POST /ipaliasing
 */
router.post('/ipaliasing', function (req, res) {
  return (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var _req$body, mac, ipv4, existing, dev;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _req$body = req.body, mac = _req$body.mac, ipv4 = _req$body.ipv4;

            if (!(typeof mac !== 'string' || !validator.isMACAddress(mac))) {
              _context.next = 3;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid mac'), { code: 'EINVAL' });

          case 3:
            if (!(typeof ipv4 !== 'string' || !validator.isIP(ipv4, 4))) {
              _context.next = 5;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid ipv4'), { code: 'EINVAL' });

          case 5:
            existing = aliases().find(function (alias) {
              return alias.mac === mac;
            });

            if (!existing) {
              _context.next = 9;
              break;
            }

            _context.next = 9;
            return (0, _bluebird.resolve)(deleteAliasAsync(existing.dev, existing.ipv4));

          case 9:
            dev = mac2dev(mac);

            if (dev) {
              _context.next = 12;
              break;
            }

            throw (0, _assign2.default)(new Error('no interface found with given mac'), { code: 'ENOENT' });

          case 12:
            _context.next = 14;
            return (0, _bluebird.resolve)(addAliasAsync(dev, ipv4));

          case 14:
            return _context.abrupt('return', aliases().find(function (alias) {
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

/**
 *  DELETE /ipaliasing
 */
router.delete('/ipaliasing', function (req, res) {
  return (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var _req$body2, mac, ipv4, existing;

    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _req$body2 = req.body, mac = _req$body2.mac, ipv4 = _req$body2.ipv4;

            if (!(typeof mac !== 'string' || !validator.isMACAddress(mac))) {
              _context2.next = 3;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid mac'), { code: 'EINVAL' });

          case 3:
            if (!(typeof ipv4 !== 'string' || !validator.isIP(ipv4, 4))) {
              _context2.next = 5;
              break;
            }

            throw (0, _assign2.default)(new Error('invalid ipv4'), { code: 'EINVAL' });

          case 5:
            existing = aliases().find(function (alias) {
              return alias.mac === mac;
            });

            console.log(existing);

            if (!existing) {
              _context2.next = 10;
              break;
            }

            _context2.next = 10;
            return (0, _bluebird.resolve)(deleteAliasAsync(existing.dev, existing.ipv4));

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

/**
  POST /mkfs
  {
    type: 'btrfs',
    target: ['sda', 'sdb', ...],
    mode: 'single' or 'raid0' or 'raid1'
  }
**/
var isValidMkfsArgs = function isValidMkfsArgs(body) {
  return (typeof body === 'undefined' ? 'undefined' : (0, _typeof3.default)(body)) === 'object' && body !== null && body.type === 'btrfs' && Array.isArray(body.target) && body.target.every(function (item) {
    return typeof item === 'string' && item.length > 0;
  }) && -1 !== ['single', 'raid0', 'raid1'].indexOf(body.mode);
};

router.post('/mkfs', function (req, res) {
  return !isValidMkfsArgs(req.body) ? invalid(res) : mkfsBtrfs(req.body, function (err, volume) {
    return err ? error(res, err) : ok(res, volume);
  });
});

/**
 * GET /net, return os and sysfs network interfaces
 */
router.get('/net', function (req, res) {
  return eth().asCallback(function (err, result) {
    return err ? error(res, err) : ok(res, result);
  });
});

/**
  POST /run
  { 
    target: fsUUID 
  }
**/
var isValidRunArgs = function isValidRunArgs(body) {
  return (typeof body === 'undefined' ? 'undefined' : (0, _typeof3.default)(body)) === 'object' && body !== null && typeof body.target === 'string' && validator.isUUID(body.target);
};

router.post('/run', function (req, res) {
  return !isValidRunArgs(req.body) ? res.status(400).json({ code: 'EINVAL', message: 'invalid arguments' }) : Boot.manualBootAsync(req.body, false).asCallback(function (err) {
    return err ? res.status(400).json({ code: err.code, message: err.message }) : res.status(200).json({ message: 'ok' });
  });
});

/**
  POST /install
  { 
    target: uuid,
    username: non-empty STRING, 
    password: non-empty STRING, 
    intall or reinstall is true
  }
**/
var isValidInstallArgs = function isValidInstallArgs(body) {
  return (typeof body === 'undefined' ? 'undefined' : (0, _typeof3.default)(body)) === 'object' && body !== null && typeof body.target === 'string' && validator.isUUID(body.target) && typeof body.username === 'string' && body.username.length > 0 && typeof body.password === 'string' && body.password.length > 0 && (body.install === true || body.reinstall === true);
};

router.post('/install', function (req, res) {
  return !isValidInstallArgs(req.body) ? invalid(res) : Boot.manualBootAsync(req.body).asCallback(function (err) {
    return err ? console.log(err) || res.status(500).json({ code: err.code, message: err.message }) : res.status(200).json({ message: 'ok' });
  });
});

/**
  GET /storage

	if query string raw=true, return original storage object
  if query string wisnuc=true, return probed storage object
	otherwise, just (pretty) storage without log
**/
router.get('/storage', function (req, res) {

  if (req.query.raw === 'true') return res.status(200).json(Storage.get(true));

  if (req.query.wisnuc !== 'true') return nolog(res).status(200).json(Storage.get());else Boot.probedStorageAsync().asCallback(function (err, storage) {
    if (err) return error(res, err);
    return ok(res, storage);
  });
});

var K = function K(x) {
  return function (y) {
    return x;
  };
};

var timedate = function timedate(callback) {
  return child.exec('timedatectl', function (err, stdout, stderr) {
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

////////////////////////////////////////
/**
const respond = (res, err, obj) => err ? 
    res.status(codeMap.get(err.code) || 500)
      .json({ code: err.code, message: err.message }) :
    res.status(200)
      .json((obj === null || obj === undefined) ? { message: 'success' } : obj)

router.use('/storage', mir)
router.use('/mir', mir)


router.post('/boot', (req, res) => {

  let obj = req.body
  if (obj instanceof Object === false)
    return res.status(400).json({ message: 'invalid arguments, req.body is not an object'})

  if (['poweroff', 'reboot', 'rebootMaintenance', 'rebootNormal'].indexOf(obj.op) === -1)
    return res.status(400).json({ message: 'op must be poweroff, reboot, or rebootMaintenance' }) 

  if (obj.target) {
    // if target is provided
    if (obj.op !== 'rebootNormal')
      return res.status(400).json({ message: 'target can only be used when op is rebootNormal' })

    // validate target FIXME
  }

  if (obj.op === 'poweroff') {

    console.log('[system] powering off')
    shutdown('poweroff')
  }
  else if (obj.op === 'reboot') {

    console.log('[system] rebooting')
    shutdown('reboot')
  }
  else if (obj.op === 'rebootMaintenance') {

    console.log('[system] rebooting into maintenance mode')
    storeDispatch({
      type: 'CONFIG_BOOT_MODE',
      data: 'maintenance'
    })
    shutdown('reboot')
  }
  else if (obj.op === 'rebootNormal') {

    console.log('[system] rebooting into normal mode')

    if (obj.target) {
      storeDispatch({
        type: 'CONFIG_BOOT_TARGET',
        data: {
          type: 'btrfs',
          uuid: target
        }
      })
    }
    else {
      storeDispatch({
        type: 'CONFIG_BOOT_TARGET'
      })
    }
    shutdown('reboot')
  }

  res.status(200).json({
    message: 'ok'
  })
})
**/
module.exports = router;