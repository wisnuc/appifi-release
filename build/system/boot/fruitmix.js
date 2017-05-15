'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _bluebird = require('bluebird');

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

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Promise = require('bluebird');

var path = require('path');
var fs = Promise.promisifyAll(require('fs'));
var child = require('child_process');
var EventEmitter = require('events');

var debug = require('debug')('fruitmix:tools');

// return ENOENT, EPARSE or local users
var retrieveNewUsersAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(froot) {
    var mpath, data, model, _model;

    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            mpath = path.join(froot, 'models', 'model.json');
            data = void 0;
            _context.prev = 2;
            _context.next = 5;
            return (0, _bluebird.resolve)(fs.readFileAsync(mpath));

          case 5:
            data = _context.sent;
            _context.next = 13;
            break;

          case 8:
            _context.prev = 8;
            _context.t0 = _context['catch'](2);

            if (!(_context.t0.code === 'ENOENT')) {
              _context.next = 12;
              break;
            }

            return _context.abrupt('return', 'ENOENT');

          case 12:
            throw _context.t0;

          case 13:
            model = void 0;
            _context.prev = 14;
            _model = JSON.parse(data);
            return _context.abrupt('return', _model.users.filter(function (u) {
              return u.type === 'local';
            }));

          case 19:
            _context.prev = 19;
            _context.t1 = _context['catch'](14);

            if (!((typeof _context.t1 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_context.t1)) === SyntaxError)) {
              _context.next = 23;
              break;
            }

            return _context.abrupt('return', 'EPARSE');

          case 23:
            throw _context.t1;

          case 24:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined, [[2, 8], [14, 19]]);
  }));

  return function retrieveNewUsersAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

// return ENOENT, EPARSE, or users
var retrieveOldUsersAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(froot) {
    var upath, data;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            upath = path.join(froot, 'models', 'users.json');
            data = void 0;
            _context2.prev = 2;
            _context2.next = 5;
            return (0, _bluebird.resolve)(fs.readFileAsync(upath));

          case 5:
            data = _context2.sent;
            _context2.next = 13;
            break;

          case 8:
            _context2.prev = 8;
            _context2.t0 = _context2['catch'](2);

            if (!(_context2.t0.code === 'ENOENT')) {
              _context2.next = 12;
              break;
            }

            return _context2.abrupt('return', 'ENOENT');

          case 12:
            throw _context2.t0;

          case 13:
            _context2.prev = 13;
            return _context2.abrupt('return', JSON.parse(data));

          case 17:
            _context2.prev = 17;
            _context2.t1 = _context2['catch'](13);

            if (!((typeof _context2.t1 === 'undefined' ? 'undefined' : (0, _typeof3.default)(_context2.t1)) === SyntaxError)) {
              _context2.next = 21;
              break;
            }

            return _context2.abrupt('return', 'EPARSE');

          case 21:
            throw _context2.t1;

          case 22:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[2, 8], [13, 17]]);
  }));

  return function retrieveOldUsersAsync(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

/**

  this module should not change anything on file system

  { status: 'EFAIL' } operation error
  { status: 'ENOENT' or 'ENOTDIR' } fruitmix not found
  { status: 'EDATA' } fruitmix installed but user data not found or cannot be parsed
  { status: 'READY', users: [...] } empty users are possible

**/
var probeAsync = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(mountpoint) {
    var froot, users;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (path.isAbsolute(mountpoint)) {
              _context3.next = 2;
              break;
            }

            throw new Error('mountpoint must be an absolute path');

          case 2:
            froot = path.join(mountpoint, 'wisnuc', 'fruitmix');

            // test fruitmix dir

            _context3.prev = 3;
            _context3.next = 6;
            return (0, _bluebird.resolve)(fs.readdirAsync(froot));

          case 6:
            _context3.next = 14;
            break;

          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3['catch'](3);

            if (!(_context3.t0.code === 'ENOENT' || _context3.t0.code === 'ENODIR')) {
              _context3.next = 12;
              break;
            }

            return _context3.abrupt('return', { status: _context3.t0.code });

          case 12:

            console.log('failed to probe fruitmix @ ' + mountpoint, _context3.t0);
            return _context3.abrupt('return', { status: 'EFAIL' });

          case 14:
            _context3.prev = 14;
            _context3.next = 17;
            return (0, _bluebird.resolve)(retrieveNewUsersAsync(froot));

          case 17:
            users = _context3.sent;

            if (!(users === 'ENOENT')) {
              _context3.next = 22;
              break;
            }

            _context3.next = 21;
            return (0, _bluebird.resolve)(retrieveOldUsersAsync(froot));

          case 21:
            users = _context3.sent;

          case 22:
            if (!(users === 'ENOENT' || users === 'EPARSE')) {
              _context3.next = 24;
              break;
            }

            return _context3.abrupt('return', { status: 'EDATA' });

          case 24:
            return _context3.abrupt('return', {
              status: 'READY',
              users: users.map(function (u) {
                return {
                  type: u.type,
                  username: u.username,
                  uuid: u.uuid,
                  avatar: u.avatar,
                  email: u.email,
                  nologin: u.nologin,
                  isFirstUser: u.isFirstUser,
                  isAdmin: u.isAdmin,
                  home: u.home,
                  library: u.library,
                  service: u.service,
                  friends: u.friends,
                  lastChangeTime: u.lastChangeTime
                };
              })
            });

          case 27:
            _context3.prev = 27;
            _context3.t1 = _context3['catch'](14);


            console.log('failed to probe fruitmix @ ' + mountpoint, _context3.t1);
            return _context3.abrupt('return', { status: 'EFAIL' });

          case 31:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined, [[3, 8], [14, 27]]);
  }));

  return function probeAsync(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

// state is a string which will be exposed to client
// starting, started, exited
// 

var Fruitmix = function (_EventEmitter) {
  (0, _inherits3.default)(Fruitmix, _EventEmitter);

  function Fruitmix(child) {
    (0, _classCallCheck3.default)(this, Fruitmix);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Fruitmix.__proto__ || (0, _getPrototypeOf2.default)(Fruitmix)).call(this));

    _this.child = child;
    _this.state = 'starting';

    _this.child.on('error', function (err) {
      _this.error = err;
    });

    _this.child.on('message', function (message) {
      switch (message.type) {
        case 'fruitmixStarted':
          _this.state = 'started';
          break;

        case 'createFirstUserDone':
          clearTimeout(_this.timer);
          if (_this.callback) {
            _this.callback(message.error, message.data);
            _this.callback = null;
          }
          break;
      }
    });

    _this.child.on('exit', function (code, signal) {
      _this.state = 'exited';
      _this.code = code;
      _this.signal = signal;
    });

    _this.callback = null;
    return _this;
  }

  (0, _createClass3.default)(Fruitmix, [{
    key: 'getState',
    value: function getState() {

      var obj = { state: this.state };

      if (this.error) obj.error = {
        code: this.error.code,
        message: this.error.message
      };

      if (this.state === 'exited') obj.exit = {
        code: this.code,
        signal: this.signal
      };

      return obj;
    }
  }, {
    key: 'createFirstUser',
    value: function createFirstUser(username, password, callback) {
      var _this2 = this;

      if (this.state !== 'started') return process.nextTick(function () {
        return callback(new Error('fruitmix not started'));
      });

      if (this.callback !== null) return process.netxTick(function () {
        return callback(new Error('try again later'));
      });

      this.callback = callback;
      this.timer = setTimeout(function () {
        if (_this2.callback) _this2.callback(new Error('timeout'));
      }, 3000);

      this.child.send({ type: 'createFirstUser', username: username, password: password });
    }
  }, {
    key: 'createFirstUserAsync',
    value: function () {
      var _ref4 = (0, _bluebird.method)(function (username, password) {
        return Promise.promisify(this.createFirstUser.bind(this))(username, password);
      });

      function createFirstUserAsync(_x4, _x5) {
        return _ref4.apply(this, arguments);
      }

      return createFirstUserAsync;
    }()
  }]);
  return Fruitmix;
}(EventEmitter);

// fork is a synchronous method
// cfs: type, uuid, mountpoint


var fork = function fork(cfs) {

  var froot = path.join(cfs.mountpoint, 'wisnuc', 'fruitmix');
  var modpath = path.resolve(__dirname, '../../fruitmix/main');

  console.log('forking fruitmix, waiting for 120s before timeout');

  return new Fruitmix(child.fork(modpath, ['--path', froot], {
    env: (0, _assign2.default)({}, process.env, { FORK: 1 }),
    stdio: ['ignore', 1, 2, 'ipc'] // this looks weird, but must be in this format, see node doc
  }));
};

module.exports = {
  probeAsync: probeAsync,
  fork: fork
};