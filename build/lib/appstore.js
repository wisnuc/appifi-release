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
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(url) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _promise2.default(function (resolve, reject) {
              _superagent2.default.get(url).set('Accept', 'text/plain').end(function (err, res) {
                err ? resolve(err) : resolve(res.text);
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
    return _ref.apply(this, arguments);
  };
}();

var retrieveRecipes = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
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

            recipes = localRecipes;
            _context2.next = 20;
            break;

          case 5:
            info('retrieve json recipes');
            _context2.next = 8;
            return retrieveText(getJsonRecipesUrl());

          case 8:
            jsonRecipes = _context2.sent;

            if (!(jsonRecipes instanceof Error)) {
              _context2.next = 11;
              break;
            }

            return _context2.abrupt('return', jsonRecipes);

          case 11:

            info('parse json recipes');
            _context2.prev = 12;

            recipes = JSON.parse(jsonRecipes);
            _context2.next = 20;
            break;

          case 16:
            _context2.prev = 16;
            _context2.t0 = _context2['catch'](12);

            info('json recipes parse error');
            return _context2.abrupt('return', _context2.t0);

          case 20:

            recipes = recipes.filter(function (recipe) {
              return (0, _dockerApps.validateRecipe)(recipe);
            });

            info('recipes retrieved');
            return _context2.abrupt('return', recipes);

          case 23:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this, [[12, 16]]);
  }));

  return function retrieveRecipes() {
    return _ref2.apply(this, arguments);
  };
}();

/* this promise never reject */


// retrieve all repos for all recipes, return component -> repo map

var retrieveRepoMap = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(recipes) {
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
            return _context3.abrupt('return', new Error('recipes can\'t be null'));

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
    return _ref3.apply(this, arguments);
  };
}();

// new appstore definition
// null (init state)
// {
//    status: 'LOADING', 'LOADED', 'ERROR'
//    errcode: ERROR only
//    errMessage: ERROR only
//    result: LOADED only
// }
//

var refreshAppStore = exports.refreshAppStore = function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
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
              data: {
                status: 'LOADING'
              }
            });

            _context4.next = 7;
            return retrieveRecipes();

          case 7:
            recipes = _context4.sent;

            if (!(recipes instanceof Error)) {
              _context4.next = 12;
              break;
            }

            console.log(recipes);
            (0, _reducers.storeDispatch)({
              type: 'APPSTORE_UPDATE',
              data: {
                status: 'ERROR',
                code: recipes.code,
                message: recipes.message
              }
            });
            return _context4.abrupt('return');

          case 12:
            _context4.next = 14;
            return retrieveRepoMap(recipes);

          case 14:
            repoMap = _context4.sent;

            if (!(repoMap instanceof Error)) {
              _context4.next = 19;
              break;
            }

            // TODO this seems unnecessary
            console.log(repoMap);
            (0, _reducers.storeDispatch)({
              type: 'APPSTORE_UPDATE',
              data: {
                status: 'ERROR',
                code: recipes.code,
                message: recipes.message
              }
            });
            return _context4.abrupt('return');

          case 19:

            (0, _reducers.storeDispatch)({
              type: 'APPSTORE_UPDATE',
              data: {
                status: 'LOADED',
                result: { recipes: recipes, repoMap: repoMap }
              }
            });

          case 20:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function refreshAppStore() {
    return _ref4.apply(this, arguments);
  };
}();

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _dockerApps = require('../lib/dockerApps');

var _reducers = require('../lib/reducers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import localRecipes from '../hosted/apps'


function info(text) {
  console.log('[appstore] ' + text);
}

var getJsonRecipesUrl = function getJsonRecipesUrl() {
  var url = (0, _reducers.storeState)().serverConfig && (0, _reducers.storeState)().serverConfig.appstoreMaster === true ? 'https://raw.githubusercontent.com/wisnuc/appifi-recipes/master/release.json' : 'https://raw.githubusercontent.com/wisnuc/appifi-recipes/release/release.json';

  info('using ' + url);
  return url;
};

var useLocalRecipes = false;function retrieveRepo(namespace, name) {

  return new _promise2.default(function (resolve) {
    // never reject
    var url = 'https://hub.docker.com/v2/repositories/' + namespace + '/' + name;
    _superagent2.default.get(url).set('Accept', 'application/json').end(function (err, res) {
      if (err) resolve(null);else if (!res.ok) resolve(null);else resolve(res.body);
    });
  });
}exports.default = {

  // init is called in app init
  reload: function reload() {
    info('loading');
    refreshAppStore().then(function (r) {
      if (r instanceof Error) {
        info('failed loading appstore');
        console.log(r);
        return;
      }
      info('loading success');
    }).catch(function (e) {
      console.log(e);
      info('loading failed');
    });
  }
};