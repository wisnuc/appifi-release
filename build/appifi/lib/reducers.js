'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.testing = exports.storeSubscribe = exports.storeDispatch = exports.storeState = exports.observeDocker = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _redux = require('redux');

var _dockerApps = require('./dockerApps');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('system:reducers');

var serverConfig = function serverConfig() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];


  switch (action.type) {
    case 'SERVER_CONFIG':
      state[action.key] = action.value;
      return state;
    default:
      return state;
  }
};

var storage = function storage() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'STORAGE_UPDATE':
      return action.data;

    default:
      return state;
  }
};

var sysboot = function sysboot() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'UPDATE_SYSBOOT':
      return action.data;

    default:
      return state;
  }
};

var fruitmixUsers = function fruitmixUsers() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'UPDATE_FRUITMIX_USERS':
      debug('update fruitmix users', action.data);
      return action.data;

    default:
      return state;
  }
};

var fruitmixDrives = function fruitmixDrives() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'UPDATE_FRUITMIX_DRIVES':
      debug('update fruitmix drives', action.data);
      return action.data;

    default:
      return state;
  }
};

var dockerObservers = [];

var observeDocker = exports.observeDocker = function observeDocker(f) {
  return dockerObservers.push(f);
};

var docker = function docker() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  var newState = void 0;

  switch (action.type) {
    case 'DAEMON_START':
      newState = {
        // pid: action.data.pid,
        volume: action.data.volume,
        events: action.data.events,
        data: null,
        computed: null
      };
      break;

    case 'DOCKER_UPDATE':
      newState = (0, _assign2.default)({}, state, {
        data: action.data
      }, {
        computed: {
          installeds: (0, _dockerApps.containersToApps)(action.data.containers)
        }
      });
      break;

    case 'DAEMON_STOP':
      newState = null;
      break;

    default:
      newState = state;
      break;
  }

  dockerObservers.forEach(function (observe) {
    return process.nextTick(function () {
      return observe(newState, state);
    });
  });
  return newState;
};

var tasks = function tasks() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var action = arguments[1];


  switch (action.type) {
    case 'TASK_ADD':
      {
        action.task.on('update', function () {
          store.dispatch({
            type: 'TASK_UPDATE'
          });
        });
        action.task.on('end', function () {
          store.dispatch({
            type: 'TASK_UPDATE'
          });
        });
        return [].concat((0, _toConsumableArray3.default)(state), [action.task]);
      }

    case 'TASK_REMOVE':
      var index = state.findIndex(function (t) {
        return t.type === action.task.type && t.id === action.task.id;
      });
      if (index === -1) {
        console.log('ERROR: TASK_REMOVE, task not found, type: ' + action.task.type + ', id: ' + action.task.id);
        return state;
      }
      return [].concat((0, _toConsumableArray3.default)(state.slice(0, index)), (0, _toConsumableArray3.default)(state.slice(index + 1)));

    default:
      return state;
  }
};

var appstore = function appstore() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'APPSTORE_UPDATE':
      return action.data;

    default:
      return state;
  }
};

var increment = function increment() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var action = arguments[1];


  switch (action.type) {
    case 'TASK_UPDATE':
      return state++;

    default:
      return state;
  }
};

var network = function network() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'NETWORK_UPDATE':
      return action.data;
    default:
      return state;
  }
};

var timeDate = function timeDate() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var action = arguments[1];


  switch (action.type) {
    case 'TIMEDATE_UPDATE':
      return action.data;
    default:
      return state;
  }
};

var barcelona = function barcelona() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var action = arguments[1];


  switch (action.type) {
    case 'BARCELONA_FANSPEED_UPDATE':
      return (0, _assign2.default)({}, state, { fanSpeed: action.data });
    case 'BARCELONA_FANSCALE_UPDATE':
      return (0, _assign2.default)({}, state, { fanScale: action.data });
    default:
      return state;
  }
};

var store = (0, _redux.createStore)((0, _redux.combineReducers)({
  increment: increment,
  serverConfig: serverConfig,
  storage: storage,
  sysboot: sysboot,
  docker: docker,
  appstore: appstore,
  tasks: tasks,
  network: network,
  timeDate: timeDate,
  barcelona: barcelona,
  fruitmixUsers: fruitmixUsers,
  fruitmixDrives: fruitmixDrives
}));

// store.subscribe(() => console.log(store.getState()))

console.log('reducers module initialized');

var storeState = exports.storeState = function storeState() {
  return store.getState();
};
var storeDispatch = exports.storeDispatch = function storeDispatch(action) {
  return store.dispatch(action);
};
var storeSubscribe = exports.storeSubscribe = function storeSubscribe(f) {
  return store.subscribe(f);
};

var testing = exports.testing = { store: store };