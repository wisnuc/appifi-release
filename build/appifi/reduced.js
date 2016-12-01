"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineReducers = exports.createStore = undefined;

var _keys = require("babel-runtime/core-js/object/keys");

var _keys2 = _interopRequireDefault(_keys);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var createStore = function createStore(reducer) {

  var state = void 0;
  var listeners = [];

  var getState = function getState() {
    return state;
  };

  var dispatch = function dispatch(action) {
    state = reducer(state, action);
    listeners.forEach(function (listener) {
      return listener();
    });
  };

  var subscribe = function subscribe(listener) {
    listeners.push(listener);
    return function () {
      listeners = listeners.filter(function (l) {
        return l !== listener;
      });
    };
  };

  dispatch({});

  return { getState: getState, dispatch: dispatch, subscribe: subscribe };
};

var combineReducers = function combineReducers(reducers) {
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var action = arguments[1];

    return (0, _keys2.default)(reducers).reduce(function (nextState, key) {
      nextState[key] = reducers[key](state[key], action);
      return nextState;
    }, {});
  };
};

exports.createStore = createStore;
exports.combineReducers = combineReducers;

/** test
const reducer1 = (state = 0, action) => {

  switch (action.type) {
  case 'INC':
    return state + 1
  case 'DEC':
    return state - 1
  default:
    return state  
  }
}

const reducer2 = (state = 100, action) => {

  switch (action.type) {
  case 'INC':
    return state + 1
  case 'DEC':
    return state - 1
  default:
    return state  
  }
}

const reducer3 = combineReducers({reducer1, reducer2})

let store = createStore(reducer3)
console.log(store.getState())
store.dispatch({type: 'INC'})
console.log(store.getState())
store.dispatch({type: 'DEC'})
console.log(store.getState())
**/