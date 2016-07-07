'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storeSubscribe = exports.storeDispatch = exports.storeState = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _redux = require('redux');

var _dockerApps = require('../lib/dockerApps');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var serverConfig = function serverConfig() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
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
  var state = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
  var action = arguments[1];


  switch (action.type) {
    case 'STORAGE_UPDATE':
      return action.data;

    default:
      return state;
  }
};

var docker = function docker() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
  var action = arguments[1];


  switch (action.type) {
    case 'DAEMON_START':
      return {
        pid: action.data.pid,
        volume: action.data.volume,
        events: action.data.events,
        data: null,
        computed: null
      };

    case 'DOCKER_UPDATE':
      return (0, _assign2.default)({}, state, {
        data: action.data
      }, {
        computed: {
          installeds: (0, _dockerApps.containersToApps)(action.data.containers)
        }
      });

    case 'DAEMON_STOP':
      return null;

    default:
      return state;
  }
};

var tasks = function tasks() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
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
  var state = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
  var action = arguments[1];


  switch (action.type) {
    case 'APPSTORE_UPDATE':
      return action.data;

    default:
      return state;
  }
};

var increment = function increment() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
  var action = arguments[1];


  switch (action.type) {
    case 'TASK_UPDATE':
      return state++;

    default:
      return state;
  }
};

var store = (0, _redux.createStore)((0, _redux.combineReducers)({
  increment: increment,
  serverConfig: serverConfig,
  storage: storage,
  docker: docker,
  appstore: appstore,
  tasks: tasks
}));

store.subscribe(function () {
  return console.log(store.getState());
});

console.log('reducers module initialized');

var storeState = exports.storeState = function storeState() {
  return store.getState();
};
var storeDispatch = exports.storeDispatch = function storeDispatch(action) {

  store.dispatch(action);
};

var storeSubscribe = exports.storeSubscribe = function storeSubscribe(f) {
  return store.subscribe(f);
};