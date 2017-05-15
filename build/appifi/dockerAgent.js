'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _events3 = require('events');

var _events4 = _interopRequireDefault(_events3);

var _error = require('./error');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * This class uses a transform as input into which user write data, and redirect data
 * to readline, emit parsed json object 
 */
var connection = function (_events) {
  (0, _inherits3.default)(connection, _events);

  function connection(response) {
    (0, _classCallCheck3.default)(this, connection);

    var _this = (0, _possibleConstructorReturn3.default)(this, (connection.__proto__ || (0, _getPrototypeOf2.default)(connection)).call(this));

    _this.response = response;
    _this.transform = new _stream2.default.Transform({
      transform: function transform(chunk, encoding, callback) {
        this.push(chunk);
        callback();
      }
    });

    _this.rl = _readline2.default.createInterface({ input: _this.transform }).on('line', function (line) {
      var json = null;
      try {
        json = JSON.parse(line);
        _this.emit('json', json);
      } catch (e) {
        // this.emit('error', new JSONParserError(e))
        // console.log(e)
        console.log(line);
      }
    }).on('close', function () {
      _this.emit('close');
    });

    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      return _this.transform.write(chunk);
    });
    response.on('end', function () {
      return _this.transform.end();
    });
    return _this;
  }

  return connection;
}(_events4.default);

/*
 * This class holds a request object, and delegate connection events to user, if connected.
 */


var agent = function (_events2) {
  (0, _inherits3.default)(agent, _events2);

  function agent(method, path, callback) {
    (0, _classCallCheck3.default)(this, agent);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (agent.__proto__ || (0, _getPrototypeOf2.default)(agent)).call(this));

    var options = {
      hostname: '127.0.0.1',
      port: 1688,
      path: path,
      method: method,
      headers: {
        'Accept': 'application/json'
      }
    };

    _this2.aborted = false;
    _this2.closed = false;

    _this2.req = _http2.default.request(options, function (res) {
      if (res.statusCode === 200) {
        var conn = new connection(res);
        conn.on('json', function (data) {
          return _this2.emit('json', data);
        });
        conn.on('close', function () {
          _this2.closed = true;
          _this2.emit('close');
        });
        callback(null, _this2);
      } else {
        callback(new _error.HttpStatusError(res.statusCode));
      }
    }); // dont chain
    _this2.req.on('error', function (e) {
      return callback(e);
    });
    _this2.req.end();
    return _this2;
  }

  (0, _createClass3.default)(agent, [{
    key: 'abort',
    value: function abort() {
      this.aborted = true;
      this.req.abort();
    }
  }]);
  return agent;
}(_events4.default);

/** the agent emit HttpStatusError / errno: EHTTPSTATUS **/


var get = function get(path, callback) {
  return new agent('GET', path, callback);
};
var post = function post(path, callback) {
  return new agent('POST', path, callback);
};

exports.default = { get: get, post: post };