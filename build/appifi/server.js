'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _bluebird = require('bluebird');

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _reducers = require('./reducers');

var _dockerApps = require('./dockerApps');

var _docker = require('./docker');

var _appstore = require('./appstore');

var _appstore2 = _interopRequireDefault(_appstore);

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
    device: (0, _reducers.storeState)().device,
    boot: (0, _reducers.storeState)().boot,
    config: (0, _reducers.storeState)().config,
    developer: (0, _reducers.storeState)().developer,
    storage: (0, _reducers.storeState)().storage,
    docker: dockerFacade((0, _reducers.storeState)().docker),
    appstore: appstoreFacade((0, _reducers.storeState)().appstore),
    tasks: tasksFacade((0, _reducers.storeState)().tasks)
  };
};

var operationAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(req) {
    var f, args;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:

            info('operation: ' + req.operation);

            f = void 0, args = void 0;

            if (!(req && req.operation)) {
              _context.next = 28;
              break;
            }

            args = req.args && Array.isArray(req.args) ? req.args : [];

            _context.t0 = req.operation;
            _context.next = _context.t0 === 'daemonStart' ? 7 : _context.t0 === 'daemonStop' ? 9 : _context.t0 === 'containerStart' ? 11 : _context.t0 === 'containerStop' ? 13 : _context.t0 === 'containerDelete' ? 15 : _context.t0 === 'installedStart' ? 17 : _context.t0 === 'installedStop' ? 19 : _context.t0 === 'appInstall' ? 21 : _context.t0 === 'appUninstall' ? 23 : _context.t0 === 'appstoreRefresh' ? 25 : 27;
            break;

          case 7:
            f = _docker.daemonStartOp;
            return _context.abrupt('break', 28);

          case 9:
            f = _docker.daemonStop;
            return _context.abrupt('break', 28);

          case 11:
            f = _docker.containerStart;
            return _context.abrupt('break', 28);

          case 13:
            f = _docker.containerStop;
            return _context.abrupt('break', 28);

          case 15:
            f = containerDeleteCommand;
            return _context.abrupt('break', 28);

          case 17:
            f = _docker.installedStart;
            return _context.abrupt('break', 28);

          case 19:
            f = _docker.installedStop;
            return _context.abrupt('break', 28);

          case 21:
            f = _docker.appInstall;
            return _context.abrupt('break', 28);

          case 23:
            f = _docker.appUninstall;
            return _context.abrupt('break', 28);

          case 25:
            f = _appstore2.default.reload;
            return _context.abrupt('break', 28);

          case 27:
            info('operation not implemented, ' + req.operation);

          case 28:
            if (!f) {
              _context.next = 32;
              break;
            }

            _context.next = 31;
            return (0, _bluebird.resolve)(f.apply(undefined, (0, _toConsumableArray3.default)(args)));

          case 31:
            return _context.abrupt('return', _context.sent);

          case 32:
            return _context.abrupt('return', null);

          case 33:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function operationAsync(_x) {
    return _ref.apply(this, arguments);
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