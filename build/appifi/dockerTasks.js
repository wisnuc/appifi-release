'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppInstallTask = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

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

var _deepmerge = require('deepmerge');

var _deepmerge2 = _interopRequireDefault(_deepmerge);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _reducers = require('../reducers');

var _pullImage = require('./pullImage');

var _pullImage2 = _interopRequireDefault(_pullImage);

var _dockerApi = require('./dockerApi');

var _containerDefault = require('./containerDefault');

var _containerDefault2 = _interopRequireDefault(_containerDefault);

var _dockerApps = require('./dockerApps');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function info(text) {
  console.log('[docker task] ' + text);
}

var Task = function (_EventEmitter) {
  (0, _inherits3.default)(Task, _EventEmitter);

  function Task(type, id, parent) {
    (0, _classCallCheck3.default)(this, Task);

    var _this = (0, _possibleConstructorReturn3.default)(this, (Task.__proto__ || (0, _getPrototypeOf2.default)(Task)).call(this));

    _this.parent = parent;
    _this.type = type;
    _this.id = id;
    _this.status = 'started';
    _this.errno = 0;
    _this.message = null;

    /** must implement getState() **/
    return _this;
  }

  (0, _createClass3.default)(Task, [{
    key: 'getState',
    value: function getState() {
      return {};
    }

    // brilliant name

  }, {
    key: 'facade',
    value: function facade() {
      return (0, _assign2.default)({
        type: this.type,
        id: this.id,
        status: this.status,
        errno: this.errno,
        message: this.message
      }, this.getState());
    }
  }]);
  return Task;
}(_events2.default);

var ImageCreateTask = function (_Task) {
  (0, _inherits3.default)(ImageCreateTask, _Task);

  function ImageCreateTask(name, tag, parent) {
    (0, _classCallCheck3.default)(this, ImageCreateTask);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (ImageCreateTask.__proto__ || (0, _getPrototypeOf2.default)(ImageCreateTask)).call(this, 'imageCreate', name + ':' + tag, parent));

    info('imageCreate ' + name + ':' + tag);
    _this2.data = null;

    (0, _pullImage2.default)(name, tag, function (e, agent) {

      if (e) {
        _this2.status = 'stopped';
        _this2.errno = e.errno;
        _this2.message = e.message;

        info('pullImage ' + name + ':' + tag + ' failed (errno: ' + e.errno + '): ' + e.message);
        _this2.emit('end');
      } else {
        _this2.agent = agent;
        agent.on('update', function (state) {
          _this2.data = state;
          _this2.emit('update');
        });

        agent.on('close', function () {
          if (_this2.aborting === true) {
            _this2.errno = 'ECONNABORTED';
          } else {
            _this2.errno = 0;
          }
          _this2.status = 'stopped';
          _this2.agent = null;
          _this2.emit('end');
        });
      }
    });
    return _this2;
  }

  (0, _createClass3.default)(ImageCreateTask, [{
    key: 'getState',
    value: function getState() {
      return this.data;
    }
  }, {
    key: 'abort',
    value: function abort() {
      if (this.agent && this.status === 'started') {
        this.aborting = true;
        this.agent.abort();
      }
    }
  }]);
  return ImageCreateTask;
}(Task);

var AppInstallTask = function (_Task2) {
  (0, _inherits3.default)(AppInstallTask, _Task2);

  function AppInstallTask(recipe, appdataDir) {
    (0, _classCallCheck3.default)(this, AppInstallTask);


    info('appInstall ' + recipe.appname);

    var _this3 = (0, _possibleConstructorReturn3.default)(this, (AppInstallTask.__proto__ || (0, _getPrototypeOf2.default)(AppInstallTask)).call(this, 'appInstall', '' + recipe.appname, null));

    _this3.recipe = recipe;
    _this3.appdataDir = appdataDir;
    _this3.id = (0, _dockerApps.calcRecipeKeyString)(recipe);
    _this3.uuid = _nodeUuid2.default.v4();
    _this3.jobs = recipe.components.map(function (compo) {

      var image = new ImageCreateTask(compo.namespace + '/' + compo.name, compo.tag, _this3);
      image.on('update', function () {
        return _this3.emit('update', _this3);
      });
      image.on('end', function () {

        if (!_this3.jobs.every(function (job) {
          /*
            console.log('>>>>')
            console.log(job)
            console.log(job.image)
            console.log(job.image.getState())
            console.log('<<<<')
          */
          if (job.image.getState() === null) return false;
          return job.image.getState().digest && job.image.getState().status ? true : false;
        })) {
          _this3.errno = -1;
          _this3.message = 'pullImage failed';
          _this3.status = 'stopped';
          info('appInstall ' + _this3.recipe.appname + ' failed, pullImage failed');

          return;
        }

        _this3.createAndStartContainers().then(function (e) {
          if (e) {
            _this3.errno = e.errno;
            _this3.message = e.message;
            console.error(e);
            info('appInstall ' + _this3.recipe.appname + ' failed');
          } else {
            _this3.errno = 0;
            _this3.message = null;
            info('appInstall ' + _this3.recipe.appname + ' success');
          }
          _this3.status = 'stopped';
          _this3.emit('end', _this3);
        }).catch(function (e) {
          _this3.errno = e.errno;
          _this3.message = e.message;
          _this3.status = 'stopped';
          info('appInstall ' + _this3.recipe.appname + ' failed (' + e.errno + '), ' + e.message);
          _this3.emit('end', _this3);
        });
      });

      return {
        compo: compo,
        image: image,
        container: null
      };
    });
    return _this3;
  }

  (0, _createClass3.default)(AppInstallTask, [{
    key: 'processBinds',
    value: function processBinds(recipeKeyString, opt) {
      var _this4 = this;

      if (!opt || !opt.HostConfig || !opt.HostConfig.Binds) return opt;

      var subpath = recipeKeyString.replace(/:/g, '/');
      opt.HostConfig.Binds = opt.HostConfig.Binds.map(function (bind) {
        return _this4.appdataDir + '/' + subpath + bind;
      });
      return opt;
    }
  }, {
    key: 'processPortBindings',
    value: function processPortBindings(recipeKeyString, opt) {
      return opt;
    }

    // 

  }, {
    key: 'createAndStartContainers',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
        var i, job, opt, re, id;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                i = this.jobs.length - 1;

              case 1:
                if (!(i >= 0)) {
                  _context.next = 18;
                  break;
                }

                job = this.jobs[i];
                opt = (0, _deepmerge2.default)((0, _containerDefault2.default)(), job.compo.config);

                opt.Image = job.compo.namespace + '/' + job.compo.name;
                opt = this.processBinds(this.id, opt);
                opt = this.processPortBindings(this.id, opt);

                // opt.Labels['appifi-signature'] = this.id
                (0, _dockerApps.installAppifiLabel)(opt.Labels, this.uuid, this.recipe);

                _context.next = 10;
                return (0, _dockerApi.containerCreate)(opt);

              case 10:
                re = _context.sent;

                if (!(re instanceof Error)) {
                  _context.next = 14;
                  break;
                }

                job.container = {
                  errno: re.errno,
                  message: re.message,
                  result: null
                };
                return _context.abrupt('return', re);

              case 14:

                job.container = {
                  errno: 0,
                  message: null,
                  result: re
                };

              case 15:
                i--;
                _context.next = 1;
                break;

              case 18:
                id = this.jobs[0].container.result.Id;

                info('starting container ' + id);
                return _context.abrupt('return', (0, _dockerApi.containerStart)(this.jobs[0].container.result.Id));

              case 21:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function createAndStartContainers() {
        return _ref.apply(this, arguments);
      }

      return createAndStartContainers;
    }()
  }, {
    key: 'getState',
    value: function getState() {

      var jobs = this.jobs.map(function (job) {
        return {
          image: job.image.facade(),
          container: job.container
        };
      });

      return {
        uuid: this.uuid,
        recipe: this.recipe,
        jobs: jobs
      };
    }
  }]);
  return AppInstallTask;
}(Task);

exports.AppInstallTask = AppInstallTask;