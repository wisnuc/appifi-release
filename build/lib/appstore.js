'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.refreshAppStore = undefined;

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

// retrieve text/plain file from url

var retrieveText = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(url) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
              _superagent2.default.get(url).set('Accept', 'text/plain').end(function (err, res) {
                err ? reject(err) : resolve(res.text);
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return function retrieveText(_x) {
    return ref.apply(this, arguments);
  };
}();

var retrieveRecipes = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
    var recipes, jsonRecipes;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            recipes = null;

            if (!useLocalRecipes) {
              _context2.next = 5;
              break;
            }

            recipes = _apps2.default;
            _context2.next = 11;
            break;

          case 5:
            info('retrieve json recipes');
            _context2.next = 8;
            return retrieveText(jsonRecipesUrl);

          case 8:
            jsonRecipes = _context2.sent;

            info('parse json recipes');
            recipes = JSON.parse(jsonRecipes);

          case 11:

            recipes.filter(function (recipe) {
              return (0, _dockerApps.validateRecipe)(recipe);
            });
            return _context2.abrupt('return', recipes);

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));
  return function retrieveRecipes() {
    return ref.apply(this, arguments);
  };
}();

/* this promise never reject */


var retrieveRepoMap = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(recipes) {
    var compos, repos, map, i;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (recipes) {
              _context3.next = 3;
              break;
            }

            warn('retrieveRepoMap: recipes null or undefined');
            return _context3.abrupt('return', null);

          case 3:

            info('retrieving repos for recipes');
            compos = [];

            recipes.forEach(function (recipe) {
              return recipe.components && recipe.components.length ? compos = [].concat((0, _toConsumableArray3.default)(compos), (0, _toConsumableArray3.default)(recipe.components)) : null;
            });

            _context3.next = 8;
            return _promise2.default.all(compos.map(function (compo) {
              return retrieveRepo(compo.namespace, compo.name);
            }));

          case 8:
            repos = _context3.sent;
            map = new _map2.default();

            for (i = 0; i < recipes.length; i++) {
              map.set(compos[i], repos[i]);
            }

            return _context3.abrupt('return', map);

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));
  return function retrieveRepoMap(_x2) {
    return ref.apply(this, arguments);
  };
}();

// TODO


var refreshAppStore = exports.refreshAppStore = function () {
  var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
    var appstore, recipes, repoMap;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            appstore = (0, _reducers.storeState)().appstore;

            if (!(appstore === 'LOADING')) {
              _context4.next = 4;
              break;
            }

            info('appstore is already loading');
            return _context4.abrupt('return');

          case 4:

            (0, _reducers.storeDispatch)({
              type: 'APPSTORE_UPDATE',
              data: 'LOADING'
            });

            _context4.next = 7;
            return retrieveRecipes();

          case 7:
            recipes = _context4.sent;

            if (recipes) {
              _context4.next = 11;
              break;
            }

            (0, _reducers.storeDispatch)({
              type: 'APPSTORE_UPDATE',
              data: 'ERROR'
            });
            return _context4.abrupt('return');

          case 11:
            _context4.next = 13;
            return retrieveRepoMap(recipes);

          case 13:
            repoMap = _context4.sent;

            if (!repoMap) {
              (0, _reducers.storeDispatch)({
                type: 'APPSTORE_UPDATE',
                data: 'ERROR'
              });
            }

            (0, _reducers.storeDispatch)({
              type: 'APPSTORE_UPDATE',
              data: { recipes: recipes, repoMap: repoMap }
            });

          case 16:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));
  return function refreshAppStore() {
    return ref.apply(this, arguments);
  };
}();

// TODO move to elsewhere


var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _apps = require('../hosted/apps');

var _apps2 = _interopRequireDefault(_apps);

var _dockerApps = require('../lib/dockerApps');

var _reducers = require('../lib/reducers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jsonRecipesUrl = 'https://raw.githubusercontent.com/wisnuc/appifi/master/hosted/apps.json';

var useLocalRecipes = false;

function info(text) {
  console.log('[appstore] ' + text);
}function retrieveRepo(namespace, name) {

  return new _promise2.default(function (resolve) {
    // never reject
    var url = 'https://hub.docker.com/v2/repositories/' + namespace + '/' + name;
    _superagent2.default.get(url).set('Accept', 'application/json').end(function (err, res) {
      if (err) resolve(null);else if (!res.ok) resolve(null);else resolve(res.body);
    });
  });
}

function getApp(recipeKeyString) {

  if (memo.status !== 'success') return null;
  var app = memo.apps.find(function (app) {
    return recipeKeyString === (0, _dockerApps.calcRecipeKeyString)(app);
  });
  return app ? (0, _clone2.default)(app) : null;
}

exports.default = {

  init: function init() {
    info('loading');
    refreshAppStore().then(function (r) {}).catch(function (e) {});
  },
  get: function get() {
    return memo;
  },

  /* server side use */
  getApp: getApp
};