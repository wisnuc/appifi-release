'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appUninstall = exports.appInstall = exports.installedStop = exports.installedStart = exports.containerDelete = exports.containerStop = exports.containerStart = exports.daemonStartOp = exports.daemonStop = exports.daemonStart = undefined;

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var appInstall = function () {
  var _ref5 = (0, _bluebird.method)(function (recipeKeyString) {

    // check if installed or installing
    var status = appStatus(recipeKeyString);
    if (status !== 'NOTFOUND') {
      info(recipeKeyString + ' status: ' + status + ', install rejected');
      return;
    }

    // retrieve recipe
    var appstore = (0, _reducers.storeState)().appstore.result;
    if (!appstore || !appstore.recipes) {
      info('recipes unavail, failed to install ' + appname + ' (' + recipeKeyString + ')');
      return;
    }

    var recipe = appstore.recipes.find(function (r) {
      return (0, _dockerApps.calcRecipeKeyString)(r) === recipeKeyString;
    });
    if (!recipe) {
      info('recipe not found: ' + recipeKeyString + ', install app failed');
      return;
    }

    // remove existing tasks if any
    var tasks = (0, _reducers.storeState)().tasks;
    var stopped = tasks.filter(function (t) {
      return t.type === 'appInstall' && t.id === recipeKeyString && t.status === 'stopped';
    });
    stopped.forEach(function (t) {
      (0, _reducers.storeDispatch)({
        type: 'TASK_REMOVE',
        task: {
          type: 'appInstall',
          id: recipeKeyString
        }
      });
    });

    // create task
    var task = new _dockerTasks.AppInstallTask(recipe, appDataDir);
    (0, _reducers.storeDispatch)({
      type: 'TASK_ADD',
      task: task
    });
  });

  return function appInstall(_x3) {
    return _ref5.apply(this, arguments);
  };
}();

var daemonStartOp = function () {
  var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(uuid) {
    var storage, volume;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(0, _reducers.storeState)().docker) {
              _context5.next = 2;
              break;
            }

            throw new Error('daemon already started');

          case 2:
            storage = (0, _reducers.storeState)().storage;
            volume = storage.volumes.find(function (vol) {
              return vol.uuid === uuid;
            });

            if (volume) {
              _context5.next = 6;
              break;
            }

            throw new Error('volume not found');

          case 6:
            if (!volume.missing) {
              _context5.next = 8;
              break;
            }

            throw new Error('volume missing');

          case 8:
            _context5.next = 10;
            return daemonStart(volume.uuid);

          case 10:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function daemonStartOp(_x4) {
    return _ref6.apply(this, arguments);
  };
}();

var containerDeleteCommand = function () {
  var _ref7 = (0, _bluebird.method)(function (id) {

    var docker = (0, _reducers.storeState)().docker;
    if (!docker || !docker.computed || !docker.computed.installeds) return null;

    var installeds = docker.computed.installeds;

    console.log('>>>>');
    installeds.forEach(function (inst) {
      return console.log(inst.containers);
    });
    console.log('<<<<');

    var inst = installeds.find(function (i) {
      return i.containers.find(function (c) {
        return c.Id === id;
      }) ? true : false;
    });

    if (inst) {
      info('container in apps cannot be deleted directly');
      return null;
    }

    (0, _dockerApi.containerDelete)(id).then(function (r) {
      console.log(r);
      info('containerDelete ' + id + ' success');
    }).catch(function (e) {
      info('containerDelete ' + id + ' failed, error: ' + e.errno + ' ' + e.message);
    });
  });

  return function containerDeleteCommand(_x5) {
    return _ref7.apply(this, arguments);
  };
}();

var installedStart = function () {
  var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(uuid) {
    var state, installeds, installed, container;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:

            info('installedStart uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context6.next = 4;
              break;
            }

            return _context6.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context6.next = 8;
              break;
            }

            return _context6.abrupt('return', { errno: -1 });

          case 8:
            container = (0, _dockerApps.appMainContainer)(installed);

            if (!(container && container.Id)) {
              _context6.next = 12;
              break;
            }

            _context6.next = 12;
            return (0, _dockerApi.containerStart)(container.Id);

          case 12:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function installedStart(_x6) {
    return _ref8.apply(this, arguments);
  };
}();

var installedStop = function () {
  var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7(uuid) {
    var state, installeds, installed, container;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:

            info('installedStop uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context7.next = 4;
              break;
            }

            return _context7.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context7.next = 8;
              break;
            }

            return _context7.abrupt('return', { errno: -1 });

          case 8:
            container = (0, _dockerApps.appMainContainer)(installed);

            if (!(container && container.Id)) {
              _context7.next = 12;
              break;
            }

            _context7.next = 12;
            return (0, _dockerApi.containerStop)(container.Id);

          case 12:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function installedStop(_x7) {
    return _ref9.apply(this, arguments);
  };
}();

var appUninstall = function () {
  var _ref10 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee8(uuid) {
    var state, installeds, installed, containers, i, _i;

    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:

            info('appUninstall uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context8.next = 4;
              break;
            }

            return _context8.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context8.next = 8;
              break;
            }

            return _context8.abrupt('return', { errno: -1 });

          case 8:
            containers = installed.containers;
            i = 0;

          case 10:
            if (!(i < containers.length)) {
              _context8.next = 16;
              break;
            }

            _context8.next = 13;
            return (0, _dockerApi.containerStop)(containers[i].Id);

          case 13:
            i++;
            _context8.next = 10;
            break;

          case 16:
            _i = 0;

          case 17:
            if (!(_i < containers.length)) {
              _context8.next = 23;
              break;
            }

            _context8.next = 20;
            return (0, _dockerApi.containerDelete)(containers[_i].Id);

          case 20:
            _i++;
            _context8.next = 17;
            break;

          case 23:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function appUninstall(_x8) {
    return _ref10.apply(this, arguments);
  };
}();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _async = require('../common/async');

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _reducers = require('../reducers');

var _dockerApi = require('./dockerApi');

var _appstore = require('./appstore');

var _appstore2 = _interopRequireDefault(_appstore);

var _dockerEvents = require('./dockerEvents');

var _dockerStateObserver = require('./dockerStateObserver');

var _dockerStateObserver2 = _interopRequireDefault(_dockerStateObserver);

var _dockerTasks = require('./dockerTasks');

var _dockerApps = require('./dockerApps');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO
var debug = (0, _debug2.default)('appifi:docker');

var dockerUrl = 'http://127.0.0.1:1688';
var dockerPidFile = '/run/wisnuc/app/docker.pid';

var rootDir = void 0;
var appDataDir = void 0;
var execRootDir = void 0;
var graphDir = void 0;

/**
  docker daemon requires two base directories to work
  1. /run/wisnuc/app to store docker.pid file
  2. [rootdir]/ (tailing with wisnuc for volumes)
        // forexample: /run/wisnuc/volumes/xxxx/wisnuc
      r for exec root
      g for graph
      appdata for docker volume
**/
var prepareDirs = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(dir) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _async.mkdirpAsync)('/run/wisnuc/app');

          case 2:

            rootDir = dir;
            appDataDir = _path2.default.join(rootDir, 'appdata');
            execRootDir = _path2.default.join(rootDir, 'r');
            graphDir = _path2.default.join(rootDir, 'g');

            _context.next = 8;
            return (0, _async.mkdirpAsync)(appDataDir);

          case 8:
            _context.next = 10;
            return (0, _async.mkdirpAsync)(_path2.default.join(rootDir, 'r'));

          case 10:
            _context.next = 12;
            return (0, _async.mkdirpAsync)(_path2.default.join(rootDir, 'g'));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function prepareDirs(_x) {
    return _ref.apply(this, arguments);
  };
}();

var info = function info(message) {
  return console.log('[docker] ' + message);
};

var probeDaemonGraphDir = function probeDaemonGraphDir(callback) {
  return _superagent2.default.get('http://localhost:1688/info').set('Accept', 'application/json').end(function (err, res) {
    if (err) return callback(err);
    if (!res.ok) return callback(new Error('request res not ok'));
    callback(null, res.body.DockerRootDir);
  });
};

var probeDaemonGraphDirAsync = (0, _bluebird.promisify)(probeDaemonGraphDir);

var startDockerEvents = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var agent, events;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return (0, _dockerEvents.dockerEventsAgent)();

          case 2:
            agent = _context2.sent;
            events = new _dockerEvents.DockerEvents(agent);


            events.on('update', function (state) {

              var oldState = (0, _reducers.storeState)().docker;
              (0, _reducers.storeDispatch)({
                type: 'DOCKER_UPDATE',
                data: {
                  data: state,
                  computed: {
                    installeds: (0, _dockerApps.containersToApps)(state.containers)
                  }
                }
              });

              var newState = (0, _reducers.storeState)().docker;
              (0, _dockerStateObserver2.default)(newState, oldState);
            });

            events.on('end', function () {
              (0, _reducers.storeDispatch)({
                type: 'DAEMON_STOP'
              });
            });

            (0, _reducers.storeDispatch)({
              type: 'DAEMON_START',
              data: { root: graphDir, events: events }
            });

          case 7:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined);
  }));

  return function startDockerEvents() {
    return _ref2.apply(this, arguments);
  };
}();

var daemonStart = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var out, err, opts, args, dockerDaemon;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            out = _async.fs.openSync('/dev/null', 'w');
            err = _async.fs.openSync('/dev/null', 'w');
            opts = {
              detached: true,
              stdio: ['ignore', out, err]
            };
            args = ['daemon', '--exec-root=' + execRootDir, '--graph=' + graphDir, '--host=127.0.0.1:1688', '--pidfile=' + dockerPidFile];
            dockerDaemon = _async.child.spawn('docker', args, opts);


            dockerDaemon.on('error', function (err) {
              console.log('dockerDaemon error >>>>');
              console.log(err);
              console.log('dockerDaemon error <<<<');
            });

            dockerDaemon.on('exit', function (code, signal) {
              dockerDaemon = null;
              if (code !== undefined) console.log('daemon exits with exitcode ' + code);
              if (signal !== undefined) console.log('daemon exits with signal ' + signal);
            });

            _context3.next = 9;
            return (0, _bluebird.delay)(3000);

          case 9:
            if (!(dockerDaemon === null)) {
              _context3.next = 11;
              break;
            }

            throw 'docker daemon stopped right after started';

          case 11:
            dockerDaemon.unref();

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function daemonStart() {
    return _ref3.apply(this, arguments);
  };
}();

var daemonStopCmd = 'start-stop-daemon --stop --pidfile "/run/wisnuc/app/docker.pid" --retry 3';

var daemonStop3 = function daemonStop3(callback) {
  return _async.child.exec(daemonStopCmd, function (err, stdout, stderr) {
    if (err) console.log('[docker] daemonStop:', err, stdout, stderr);else console.log('[docker] daemonStop: success');

    callback(err);
  });
};

var daemonStop = (0, _bluebird.promisify)(daemonStop3);

var initAsync = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(dir) {
    var probedGraphDir;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:

            debug('docker init dir', dir);

            _context4.next = 3;
            return prepareDirs(dir);

          case 3:

            debug('graph dir', graphDir);

            probedGraphDir = void 0;
            _context4.prev = 5;
            _context4.next = 8;
            return probeDaemonGraphDirAsync();

          case 8:
            probedGraphDir = _context4.sent;
            _context4.next = 13;
            break;

          case 11:
            _context4.prev = 11;
            _context4.t0 = _context4['catch'](5);

          case 13:

            debug('probed graph dir', probedGraphDir);

            if (!(probedGraphDir === graphDir)) {
              _context4.next = 18;
              break;
            }

            console.log('[docker] daemon already started @ ' + rootDir);
            _context4.next = 27;
            break;

          case 18:
            if (!probedGraphDir) {
              _context4.next = 24;
              break;
            }

            console.log('[docker] another daemon already started (graphDir) @ {probedGraphDir}, try stopping it');
            _context4.next = 22;
            return daemonStop();

          case 22:
            _context4.next = 24;
            return (0, _bluebird.delay)(1000);

          case 24:

            console.log('[docker] starting daemon @ ' + rootDir);
            _context4.next = 27;
            return daemonStart();

          case 27:
            _context4.next = 29;
            return startDockerEvents();

          case 29:
            console.log('[docker] docker events listener started');
            _appstore2.default.reload();
            console.log('[docker] appstore reloading');

          case 32:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, undefined, [[5, 11]]);
  }));

  return function initAsync(_x2) {
    return _ref4.apply(this, arguments);
  };
}();

function appStatus(recipeKeyString) {

  var state = (0, _reducers.storeState)();

  if (state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds) {
    return 'UNAVAIL';
  }

  var installeds = state.docker.computed.installeds;

  var inst = installeds.find(function (i) {
    return i.recipeKeyString === recipeKeyString;
  });
  if (inst) return 'INSTALLED';

  var tasks = state.tasks;
  var task = tasks.find(function (t) {
    return t.type === 'appInstall' && t.id === recipeKeyString && t.status === 'started';
  });
  if (task) return 'INSTALLING';

  return 'NOTFOUND';
}

exports.default = {

  init: function init(dir) {
    initAsync(dir).then(function (r) {
      // r undefined
      console.log('[docker] initialized');
    }).catch(function (e) {
      info('ERROR: init failed');
      console.log(e);
    });
  }
};
exports.daemonStart = daemonStart;
exports.daemonStop = daemonStop;
exports.daemonStartOp = daemonStartOp;
exports.containerStart = _dockerApi.containerStart;
exports.containerStop = _dockerApi.containerStop;
exports.containerDelete = _dockerApi.containerDelete;
exports.installedStart = installedStart;
exports.installedStop = installedStop;
exports.appInstall = appInstall;
exports.appUninstall = appUninstall;