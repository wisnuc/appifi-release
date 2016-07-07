'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _reducers = require('../lib/reducers');

var _dockerApps = require('../lib/dockerApps');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _status = 0;

(0, _reducers.storeSubscribe)(function () {
  _status++;
  console.log('[server] status updated: ' + _status);
});

var appstoreFacade = function appstoreFacade(appstore) {

  if (appstore === null) return null;

  if (appstore.status === 'LOADING') return { status: 'LOADING' };

  if (appstore.status === 'ERROR') return { status: 'ERROR', code: appstore.code, message: appstore.message };

  var _appstore$result = appstore.result;
  var recipes = _appstore$result.recipes;
  var repoMap = _appstore$result.repoMap;

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
  facade.pid = docker.pid;
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
    tasks: tasksFacade((0, _reducers.storeState)().tasks)
  };
};

exports.default = {

  status: function status() {
    return { status: _status };
  },

  get: function get() {
    var f = facade();
    return f;
  }
};


console.log('server module initialized');