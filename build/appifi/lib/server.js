'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('./reducers');

var _dockerApps = require('./dockerApps');

var _docker = require('./docker');

var _storage = require('./storage');

var _eth = require('./eth');

var _eth2 = _interopRequireDefault(_eth);

var _barcelona = require('../../system/barcelona');

var _appstore = require('./appstore');

var _appstore2 = _interopRequireDefault(_appstore);

var _timedate = require('./timedate');

var _timedate2 = _interopRequireDefault(_timedate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:server');

var _status = 0;

var info = function info(text) {
  return console.log('[server] ' + text);
};

(0, _reducers.storeSubscribe)(function () {
  _status++;
  debug('status update', _status);
});

var appstoreFacade = function appstoreFacade(appstore) {

  if (appstore === null) return null;

  if (appstore.status === 'LOADING') return { status: 'LOADING' };

  if (appstore.status === 'ERROR') return { status: 'ERROR', code: appstore.code, message: appstore.message };

  var _appstore$result = appstore.result,
      recipes = _appstore$result.recipes,
      repoMap = _appstore$result.repoMap;

  if (!repoMap) {
    return {
      status: 'LOADED',
      result: recipes
    };
  }

  // be careful. if recipes are cloned first, then cloned 
  // recipes' components won't be the key in the map any more !!!

  var appended = [];

  recipes.forEach(function (recipe) {

    var components = [];
    recipe.components.forEach(function (compo) {
      var repo = repoMap.get(compo);
      if (repo === undefined) repo = null;
      components.push((0, _assign2.default)({}, compo, { repo: repo }));
    });
    appended.push((0, _assign2.default)({}, recipe, { components: components }));
  });

  appended.forEach(function (recipe) {
    return recipe.key = (0, _dockerApps.calcRecipeKeyString)(recipe);
  });
  return {
    status: 'LOADED',
    result: appended
  };
};

var installedFacades = function installedFacades(installeds) {

  if (!installeds) return null;

  var facade = installeds.map(function (inst) {
    return (0, _assign2.default)({}, inst, {
      container: undefined,
      containerIds: inst.containers.map(function (c) {
        return c.Id;
      })
    });
  });

  // remove containers property, dirty, is there a better way ??? TODO
  facade.forEach(function (f) {
    return f.containers = undefined;
  });
  return facade;
};

var dockerFacade = function dockerFacade(docker) {

  if (!docker) return null;

  var facade = {};
  // facade.pid = docker.pid
  facade.volume = docker.volume;

  if (docker.data) {
    facade = (0, _assign2.default)({}, facade, docker.data, {
      installeds: installedFacades(docker.computed.installeds)
    });
  }

  return facade;
};

var tasksFacade = function tasksFacade(tasks) {

  if (!tasks || !tasks.length) return [];
  return tasks.map(function (t) {
    return t.facade();
  });
};

var facade = function facade() {

  return {
    status: _status,
    config: (0, _reducers.storeState)().serverConfig,
    storage: (0, _reducers.storeState)().storage,
    docker: dockerFacade((0, _reducers.storeState)().docker),
    appstore: appstoreFacade((0, _reducers.storeState)().appstore),
    tasks: tasksFacade((0, _reducers.storeState)().tasks),
    network: (0, _reducers.storeState)().network,
    timeDate: (0, _reducers.storeState)().timeDate,
    barcelona: (0, _reducers.storeState)().barcelona
  };
};

var networkUpdate = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _eth2.default)();

          case 2:
            _context.t0 = _context.sent;
            _context.t1 = {
              type: 'NETWORK_UPDATE',
              data: _context.t0
            };
            return _context.abrupt('return', (0, _reducers.storeDispatch)(_context.t1));

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function networkUpdate() {
    return _ref.apply(this, arguments);
  };
}();

var timeDateUpdate = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _bluebird.promisify)(_timedate2.default)();

          case 2:
            _context2.t0 = _context2.sent;
            _context2.t1 = {
              type: 'TIMEDATE_UPDATE',
              data: _context2.t0
            };
            return _context2.abrupt('return', (0, _reducers.storeDispatch)(_context2.t1));

          case 5:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function timeDateUpdate() {
    return _ref2.apply(this, arguments);
  };
}();

var shutdown = function shutdown(cmd) {
  return setTimeout(function () {
    _child_process2.default.exec('echo "PWRD_LED 3" > /proc/BOARD_io', function (err) {});
    _child_process2.default.exec('' + cmd, function (err) {});
  }, 1000);
};

var systemReboot = function () {
  var _ref3 = (0, _bluebird.method)(function () {
    return shutdown('reboot');
  });

  return function systemReboot() {
    return _ref3.apply(this, arguments);
  };
}();
var systemPowerOff = function () {
  var _ref4 = (0, _bluebird.method)(function () {
    return shutdown('poweroff');
  });

  return function systemPowerOff() {
    return _ref4.apply(this, arguments);
  };
}();

var operationAsync = function () {
  var _ref5 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(req) {
    var f, args;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:

            info('operation: ' + req.operation);

            f = void 0, args = void 0;

            if (!(req && req.operation)) {
              _context3.next = 42;
              break;
            }

            args = req.args && Array.isArray(req.args) ? req.args : [];

            _context3.t0 = req.operation;
            _context3.next = _context3.t0 === 'daemonStart' ? 7 : _context3.t0 === 'daemonStop' ? 9 : _context3.t0 === 'containerStart' ? 11 : _context3.t0 === 'containerStop' ? 13 : _context3.t0 === 'containerDelete' ? 15 : _context3.t0 === 'installedStart' ? 17 : _context3.t0 === 'installedStop' ? 19 : _context3.t0 === 'appInstall' ? 21 : _context3.t0 === 'appUninstall' ? 23 : _context3.t0 === 'mkfs_btrfs' ? 25 : _context3.t0 === 'networkUpdate' ? 27 : _context3.t0 === 'barcelonaFanScaleUpdate' ? 29 : _context3.t0 === 'barcelonaFanSpeedUpdate' ? 31 : _context3.t0 === 'timeDateUpdate' ? 33 : _context3.t0 === 'systemReboot' ? 35 : _context3.t0 === 'systemPowerOff' ? 37 : _context3.t0 === 'appstoreRefresh' ? 39 : 41;
            break;

          case 7:
            f = _docker.daemonStartOp;
            return _context3.abrupt('break', 42);

          case 9:
            f = _docker.daemonStop;
            return _context3.abrupt('break', 42);

          case 11:
            f = _docker.containerStart;
            return _context3.abrupt('break', 42);

          case 13:
            f = _docker.containerStop;
            return _context3.abrupt('break', 42);

          case 15:
            f = containerDeleteCommand;
            return _context3.abrupt('break', 42);

          case 17:
            f = _docker.installedStart;
            return _context3.abrupt('break', 42);

          case 19:
            f = _docker.installedStop;
            return _context3.abrupt('break', 42);

          case 21:
            f = _docker.appInstall;
            return _context3.abrupt('break', 42);

          case 23:
            f = _docker.appUninstall;
            return _context3.abrupt('break', 42);

          case 25:
            f = _storage.mkfsBtrfsOperation;
            return _context3.abrupt('break', 42);

          case 27:
            f = networkUpdate;
            return _context3.abrupt('break', 42);

          case 29:
            f = _barcelona.setFanScale;
            return _context3.abrupt('break', 42);

          case 31:
            f = _barcelona.updateFanSpeed;
            return _context3.abrupt('break', 42);

          case 33:
            f = timeDateUpdate;
            return _context3.abrupt('break', 42);

          case 35:
            f = systemReboot;
            return _context3.abrupt('break', 42);

          case 37:
            f = systemPowerOff;
            return _context3.abrupt('break', 42);

          case 39:
            f = _appstore2.default.reload;
            return _context3.abrupt('break', 42);

          case 41:
            info('operation not implemented, ' + req.operation);

          case 42:
            if (!f) {
              _context3.next = 46;
              break;
            }

            _context3.next = 45;
            return f.apply(undefined, (0, _toConsumableArray3.default)(args));

          case 45:
            return _context3.abrupt('return', _context3.sent);

          case 46:
            return _context3.abrupt('return', null);

          case 47:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function operationAsync(_x) {
    return _ref5.apply(this, arguments);
  };
}();

exports.default = {

  status: function status() {
    return { status: _status };
  },

  get: function get() {
    var f = facade();
    return f;
  },

  operation: function operation(req, callback) {
    operationAsync(req).then(function (r) {
      return callback(null);
    }).catch(function (e) {
      return callback(e);
    });
  }
};


console.log('server module initialized');