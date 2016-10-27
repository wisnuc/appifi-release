'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _dockeragent = require('./dockeragent');

var _dockeragent2 = _interopRequireDefault(_dockeragent);

var _reduced = require('./reduced');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var pullImage = function (_EventEmitter) {
  (0, _inherits3.default)(pullImage, _EventEmitter);

  function pullImage(image, tag, callback) {
    (0, _classCallCheck3.default)(this, pullImage);

    var _this = (0, _possibleConstructorReturn3.default)(this, (pullImage.__proto__ || (0, _getPrototypeOf2.default)(pullImage)).call(this));

    _this.image = image;
    _this.tag = tag;
    _this.agent = null;

    _this.status = 'started';
    _this.error = null;
    _this.message = null;

    _this.state = null;
    _this.store = (0, _reduced.createStore)(_this.reducer.bind(_this)); // bound
    _this.store.subscribe(function () {
      if (_this.state !== _this.store.getState()) {
        _this.state = _this.store.getState();
        _this.emit('update', _this.state);
      }
    });

    var url = '/images/create?fromImage=' + _this.image + '&tag=' + _this.tag;
    _dockeragent2.default.post(url, function (e, agent) {

      if (e) return callback(e);
      agent.on('json', function (msg) {
        return _this.store.dispatch(msg);
      });
      agent.on('close', function () {
        return _this.emit('close');
      });

      _this.agent = agent;
      callback(null, _this);
    });
    return _this;
  }

  (0, _createClass3.default)(pullImage, [{
    key: 'abort',
    value: function abort() {
      if (this.agent) this.agent.abort();
    }
  }, {
    key: 'reducer',
    value: function reducer(state, msg) {

      // console.log(msg)

      if (msg.status === undefined) return (0, _assign2.default)({}, state, {
        from: null,
        threads: [],
        digest: null,
        status: null
      });

      if (msg.status.startsWith('Pulling from') || msg.status.startsWith('Pulling repository')) {
        return (0, _assign2.default)({}, state, { from: msg.status });
      }

      if (msg.status.startsWith('Digest: ')) {
        return (0, _assign2.default)({}, state, { digest: msg.status });
      }

      if (msg.status.startsWith('Status: Downloaded newer image for') || msg.status.startsWith('Status: Image is up to date')) {
        return (0, _assign2.default)({}, state, { status: msg.status });
      }

      // test thread in a permissive way
      var regex = /^[a-f0-9]+$/;
      if (msg.id && msg.id.length === 12 && regex.test(msg.id)) {
        var index = state.threads.findIndex(function (t) {
          return t.id === msg.id;
        });
        if (index === -1) {
          var threads = [].concat((0, _toConsumableArray3.default)(state.threads), [msg]);
          return (0, _assign2.default)({}, state, { threads: threads });
        } else {
          var _threads = [].concat((0, _toConsumableArray3.default)(state.threads.slice(0, index)), [msg], (0, _toConsumableArray3.default)(state.threads.slice(index + 1)));
          return (0, _assign2.default)({}, state, { threads: _threads });
        }
      }

      console.log('--- unexpected message');
      console.log(msg);
      console.log('--- unexpected message end');
      return state;
    }
  }]);
  return pullImage;
}(_events2.default);

exports.default = function (image, tag, callback) {
  return new pullImage(image, tag, callback);
};