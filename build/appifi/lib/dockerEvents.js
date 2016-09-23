'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DockerEvents = exports.dockerEventsAgent = undefined;

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

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

/*
 * should return state TODO
 */

var probeDockerState = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var containersUrl, imagesUrl, infoUrl, versionUrl, volumesUrl, networksUrl, r, id, state;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            containersUrl = '/containers/json?all=1';
            imagesUrl = '/images/json';
            infoUrl = '/info';
            versionUrl = '/version';
            volumesUrl = '/volumes';
            networksUrl = '/networks';
            _context.next = 8;
            return (0, _bluebird.all)([dockerApiGet(containersUrl), dockerApiGet(imagesUrl), dockerApiGet(infoUrl), dockerApiGet(versionUrl), dockerApiGet(volumesUrl), dockerApiGet(networksUrl)]);

          case 8:
            r = _context.sent;
            _context.next = 11;
            return (0, _bluebird.all)(r[1].map(function (img) {
              return dockerApiGet('/images/' + img.Id.slice(7) + '/json');
            }));

          case 11:
            id = _context.sent;
            state = {
              containers: r[0],
              images: r[1],
              imageDetails: id,
              info: r[2],
              version: r[3],
              volumes: r[4],
              networks: r[5]
            };
            return _context.abrupt('return', state);

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function probeDockerState() {
    return _ref.apply(this, arguments);
  };
}();

/*
 * agent or null
 */


var dockerEventsAgent = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return new _bluebird2.default(function (resolve) {
              return (// TODO never reject?
                _dockeragent2.default.get('/events', function (e, r) {
                  return e ? resolve(null) : resolve(r);
                })
              );
            });

          case 2:
            return _context2.abrupt('return', _context2.sent);

          case 3:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function dockerEventsAgent() {
    return _ref2.apply(this, arguments);
  };
}();

/*
 * important class, wrap timeout and probeDockerState
 */


var _events2 = require('events');

var _events3 = _interopRequireDefault(_events2);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _dockeragent = require('./dockeragent');

var _dockeragent2 = _interopRequireDefault(_dockeragent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dockerUrl = 'http://127.0.0.1:1688';

function dockerApiGet(url) {
  return new _bluebird2.default(function (resolve, reject) {
    return _superagent2.default.get(dockerUrl + url).set('Accept', 'application/json').end(function (err, res) {
      return err ? reject(null) : resolve(res.body);
    });
  });
}
var DockerEvents = function (_events) {
  (0, _inherits3.default)(DockerEvents, _events);

  function DockerEvents(agent, interval) {
    (0, _classCallCheck3.default)(this, DockerEvents);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(DockerEvents).call(this));

    if (!interval) interval = 300;

    _this.timeout = null;
    _this.agent = agent;

    agent.on('json', function () {
      if (_this.timeout) clearTimeout(_this.timeout);
      _this.timeout = setTimeout(function () {
        if (agent.aborted || agent.closed) return;
        _this.probe();
      }, interval);
    });

    agent.on('close', function () {
      if (_this.timeout) clearTimeout(_this.timeout);
      _this.emit('end');
    });

    // initial update
    _this.probe();
    return _this;
  }

  (0, _createClass3.default)(DockerEvents, [{
    key: 'probe',
    value: function probe() {
      var _this2 = this;

      probeDockerState().then(function (state) {
        if (_this2.agent.aborted || _this2.agent.closed) return;
        _this2.emit('update', state);
      });
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.timeout) clearTimeout(this.timeout);
      if (this.agent) this.agent.abort();
    }
  }]);
  return DockerEvents;
}(_events3.default);

exports.dockerEventsAgent = dockerEventsAgent;
exports.DockerEvents = DockerEvents;