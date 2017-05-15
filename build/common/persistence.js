'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');

var mkdirpAsync = (0, _bluebird.promisify)(require('mkdirp'));
var UUID = require('node-uuid');

// state: IDLE, PENDING, WIP
//
//                       NEWREQ                          TIMEOUT                   SUCCESS                              FAIL
// IDLE: nothing      -> PENDING with NEWREQ                        
// PENDING: req       -> re-TIMER and req with NEWREQ    -> WIP with req as req         
// WIP: req & next    -> next = NEWREQ                                             next ? -> PENDING with next as req   next ? -> PENDING with next as req
//                                                                                      : -> IDLE                            : -> PENDING with req as req

var State = function () {
  function State(ctx) {
    (0, _classCallCheck3.default)(this, State);

    this.ctx = ctx;
  }

  (0, _createClass3.default)(State, [{
    key: 'setState',
    value: function setState(nextState) {
      this.exit();

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      this.ctx.state = new (Function.prototype.bind.apply(nextState, [null].concat([this.ctx], args)))();
    }
  }, {
    key: 'exit',
    value: function exit() {}
  }]);
  return State;
}();

var Idle = function (_State) {
  (0, _inherits3.default)(Idle, _State);

  function Idle() {
    (0, _classCallCheck3.default)(this, Idle);
    return (0, _possibleConstructorReturn3.default)(this, (Idle.__proto__ || (0, _getPrototypeOf2.default)(Idle)).apply(this, arguments));
  }

  (0, _createClass3.default)(Idle, [{
    key: 'save',
    value: function save(data) {
      this.setState(Pending, data);
    }
  }]);
  return Idle;
}(State);

var Pending = function (_State2) {
  (0, _inherits3.default)(Pending, _State2);

  function Pending(ctx, data) {
    (0, _classCallCheck3.default)(this, Pending);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (Pending.__proto__ || (0, _getPrototypeOf2.default)(Pending)).call(this, ctx));

    _this2.save(data);
    return _this2;
  }

  (0, _createClass3.default)(Pending, [{
    key: 'save',
    value: function save(data) {
      var _this3 = this;

      clearTimeout(this.timer);
      this.data = data;
      this.timer = setTimeout(function () {
        _this3.setState(Working, _this3.data);
      }, this.ctx.delay);
    }
  }, {
    key: 'exit',
    value: function exit() {
      clearTimeout(this.timer);
    }
  }]);
  return Pending;
}(State);

var Working = function (_State3) {
  (0, _inherits3.default)(Working, _State3);

  function Working(ctx, data) {
    (0, _classCallCheck3.default)(this, Working);

    var _this4 = (0, _possibleConstructorReturn3.default)(this, (Working.__proto__ || (0, _getPrototypeOf2.default)(Working)).call(this, ctx));

    _this4.data = data;

    // console.log('start saving data', data)

    var tmpfile = path.join(_this4.ctx.tmpdir, UUID.v4());
    fs.writeFile(tmpfile, (0, _stringify2.default)(_this4.data), function (err) {

      if (err) return _this4.error(err);
      fs.rename(tmpfile, _this4.ctx.target, function (err) {

        // console.log('finished saving data', data, err)

        if (err) return _this4.error(err);
        _this4.success();
      });
    });
    return _this4;
  }

  (0, _createClass3.default)(Working, [{
    key: 'error',
    value: function error(e) {

      console.log('error writing persistent file', e);

      if (this.next) this.setState(Pending, this.next);else this.setState(Pending, this.data);
    }
  }, {
    key: 'success',
    value: function success() {
      if (this.next) this.setState(Pending, this.next);else this.setState(Idle);
    }
  }, {
    key: 'save',
    value: function save(data) {
      // console.log('Working save', data)
      this.next = data;
    }
  }]);
  return Working;
}(State);

var Persistence = function () {
  function Persistence(target, tmpdir, delay) {
    (0, _classCallCheck3.default)(this, Persistence);


    this.target = target;
    this.tmpdir = tmpdir;
    this.delay = delay || 500;
    this.state = new Idle(this);
  }

  (0, _createClass3.default)(Persistence, [{
    key: 'save',
    value: function save(data) {
      this.state.save(data);
    }
  }]);
  return Persistence;
}();

var createPersistenceAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(target, tmpdir, delay) {
    var targetDir;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            targetDir = path.dirname(target);
            _context.next = 3;
            return (0, _bluebird.resolve)(mkdirpAsync(targetDir));

          case 3:
            _context.next = 5;
            return (0, _bluebird.resolve)(mkdirpAsync(tmpdir));

          case 5:
            return _context.abrupt('return', new Persistence(target, tmpdir, delay));

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createPersistenceAsync(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

module.exports = createPersistenceAsync;