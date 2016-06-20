'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AppInstallTask = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

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

var _pullImage = require('./pullImage');

var _pullImage2 = _interopRequireDefault(_pullImage);

var _dockerapi = require('./dockerapi');

var _containerDefault = require('./containerDefault');

var _containerDefault2 = _interopRequireDefault(_containerDefault);

var _task3 = require('./task');

var _task4 = _interopRequireDefault(_task3);

var _dockerApps = require('./dockerApps');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function info(text) {
  console.log('[docker task] ' + text);
}

var ImageCreateTask = function (_task) {
  (0, _inherits3.default)(ImageCreateTask, _task);

  function ImageCreateTask(name, tag, parent) {
    (0, _classCallCheck3.default)(this, ImageCreateTask);

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(ImageCreateTask).call(this, 'imageCreate', name + ':' + tag, parent));

    info('imageCreate ' + name + ':' + tag);
    _this.data = null;

    (0, _pullImage2.default)(name, tag, function (e, agent) {

      if (e) {
        _this.status = 'stopped';
        _this.errno = e.errno;
        _this.message = e.message;

        info('pullImage ' + name + ':' + tag + ' failed (errno: ' + e.errno + '): ' + e.message);
        _this.emit('end');
      } else {
        _this.agent = agent;
        agent.on('update', function (state) {
          _this.data = state;
          _this.emit('update');
        });

        agent.on('close', function () {
          if (_this.aborting === true) {
            _this.errno = 'ECONNABORTED';
          } else {
            _this.errno = 0;
          }
          _this.status = 'stopped';
          _this.agent = null;
          _this.emit('end');
        });
      }
    });
    return _this;
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
}(_task4.default);

var AppInstallTask = function (_task2) {
  (0, _inherits3.default)(AppInstallTask, _task2);

  function AppInstallTask(recipe) {
    (0, _classCallCheck3.default)(this, AppInstallTask);


    info('appInstall ' + recipe.appname);

    var _this2 = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(AppInstallTask).call(this, 'appInstall', '' + recipe.appname, null));

    _this2.recipe = recipe;
    _this2.id = (0, _dockerApps.calcRecipeKeyString)(recipe);
    _this2.uuid = _nodeUuid2.default.v4();
    _this2.jobs = recipe.components.map(function (compo) {

      var image = new ImageCreateTask(compo.namespace + '/' + compo.name, compo.tag, _this2);
      image.on('update', function () {
        return _this2.emit('update', _this2);
      });
      image.on('end', function () {

        if (!_this2.jobs.every(function (job) {
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
          _this2.errno = -1;
          _this2.message = 'pullImage failed';
          _this2.status = 'stopped';
          info('appInstall ' + _this2.recipe.appname + ' failed, pullImage failed');

          return;
        }

        _this2.createAndStartContainers().then(function (e) {
          if (e) {
            _this2.errno = e.errno;
            _this2.message = e.message;
            info('appInstall ' + _this2.recipe.appname + ' failed');
          } else {
            _this2.errno = 0;
            _this2.message = null;
            info('appInstall ' + _this2.recipe.appname + ' success');
          }
          _this2.status = 'stopped';
          _this2.emit('end', _this2);
        }).catch(function (e) {
          _this2.errno = e.errno;
          _this2.message = e.message;
          _this2.status = 'stopped';
          info('appInstall ' + _this2.recipe.appname + ' failed (' + e.errno + '), ' + e.message);
          _this2.emit('end', _this2);
        });
      });

      return {
        compo: compo,
        image: image,
        container: null
      };
    });
    return _this2;
  }

  (0, _createClass3.default)(AppInstallTask, [{
    key: 'createAndStartContainers',
    value: function () {
      var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        var i, job, opt, re, id;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                i = this.jobs.length - 1;

              case 1:
                if (!(i >= 0)) {
                  _context.next = 16;
                  break;
                }

                job = this.jobs[i];
                opt = (0, _deepmerge2.default)((0, _containerDefault2.default)(), job.compo.config);

                opt.Image = job.compo.namespace + '/' + job.compo.name;

                // opt.Labels['appifi-signature'] = this.id
                (0, _dockerApps.installAppifiLabel)(opt.Labels, this.uuid, this.recipe);

                _context.next = 8;
                return (0, _dockerapi.containerCreate)(opt);

              case 8:
                re = _context.sent;

                if (!(re instanceof Error)) {
                  _context.next = 12;
                  break;
                }

                job.container = {
                  errno: re.errno,
                  message: re.message,
                  result: null
                };
                return _context.abrupt('return', re);

              case 12:

                job.container = {
                  errno: 0,
                  message: null,
                  result: re
                };

              case 13:
                i--;
                _context.next = 1;
                break;

              case 16:
                id = this.jobs[0].container.result.Id;

                info('starting container ' + id);
                return _context.abrupt('return', (0, _dockerapi.containerStart)(this.jobs[0].container.result.Id));

              case 19:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function createAndStartContainers() {
        return ref.apply(this, arguments);
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
}(_task4.default);

exports.AppInstallTask = AppInstallTask;