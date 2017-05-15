'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var IpcHandler = function () {
  function IpcHandler() {
    (0, _classCallCheck3.default)(this, IpcHandler);

    this.commandMap = new _map2.default();
  }

  (0, _createClass3.default)(IpcHandler, [{
    key: 'register',
    value: function register(key, val) {
      this.commandMap.set(key, val);
    }
  }, {
    key: 'registerMap',
    value: function registerMap(map) {
      this.commandMap = new _map2.default([].concat((0, _toConsumableArray3.default)(this.commandMap), (0, _toConsumableArray3.default)(map)));
    }

    // no id is illegal

  }, {
    key: 'handleCommand',
    value: function handleCommand(worker, msg) {
      var id = msg.id,
          op = msg.op,
          args = msg.args;

      var handler = this.commandMap.get(op);

      if (!handler) {
        return worker.send({
          type: 'command',
          id: id,
          err: {
            code: 'ENOHANDLER',
            message: 'no handler found for ' + op
          }
        });
      }

      // default data to null, otherwise it will be eliminated
      handler(msg.args, function (err) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;


        // change to debug TODO
        // console.log('handler', err || data)

        if (err) {
          worker.send({
            type: 'command',
            id: id,
            err: {
              code: err.code,
              message: err.message
            }
          });
        } else {
          worker.send({ type: 'command', id: id, data: data });
        }
      });
    }
  }, {
    key: 'handle',
    value: function handle(worker, msg) {
      switch (msg.type) {
        case 'command':
          this.handleCommand(worker, msg);
          break;
        default:
          break;
      }
    }
  }]);
  return IpcHandler;
}();

var createIpcHandler = function createIpcHandler() {
  return new IpcHandler();
};

exports.default = createIpcHandler;