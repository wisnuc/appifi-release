'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dockerFruitmixDir = exports.dockerAppdataDir = exports.probeDaemon = exports.appUninstall = exports.appInstall = exports.installedStop = exports.installedStart = exports.containerDelete = exports.containerStop = exports.containerStart = exports.daemonStartOp = exports.daemonStop = exports.daemonStart = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

/*
 * return {pid, volume, listener} or null
 */

var daemonStart = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(uuid) {
    var out, err, mountpoint, execRootDir, graphDir, appDataDir, fruitmixDir, opts, args, dockerDaemon, agent;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            out = _fs2.default.openSync('/dev/null', 'w');
            err = _fs2.default.openSync('/dev/null', 'w');
            mountpoint = dockerVolumesDir + '/' + uuid;
            execRootDir = mountpoint + '/wisnuc/r';
            graphDir = mountpoint + '/wisnuc/g';
            appDataDir = dockerVolumesDir + '/' + uuid + '/wisnuc/appdata';
            fruitmixDir = dockerVolumesDir + '/' + uuid + '/wisnuc/fruitmix';
            _context.next = 9;
            return mkdirpAsync(execRootDir);

          case 9:
            _context.next = 11;
            return mkdirpAsync(graphDir);

          case 11:
            _context.next = 13;
            return mkdirpAsync(appDataDir);

          case 13:
            _context.next = 15;
            return mkdirpAsync(fruitmixDir);

          case 15:
            opts = {
              cwd: mountpoint,
              detached: true,
              stdio: ['ignore', out, err]
            };
            args = ['daemon', '--exec-root=' + execRootDir, '--graph=' + graphDir, '--host=127.0.0.1:1688', '--pidfile=' + dockerPidFile];
            dockerDaemon = _child_process2.default.spawn('docker', args, opts);


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

            _context.next = 22;
            return (0, _utils.delay)(3000);

          case 22:
            if (!(dockerDaemon === null)) {
              _context.next = 24;
              break;
            }

            throw 'docker daemon stopped right after started';

          case 24:
            dockerDaemon.unref();

            _context.next = 27;
            return (0, _dockerEvents.dockerEventsAgent)();

          case 27:
            agent = _context.sent;

            dispatchDaemonStart(uuid, agent);

          case 29:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function daemonStart(_x) {
    return _ref.apply(this, arguments);
  };
}();

var appInstall = function () {
  var _ref2 = (0, _bluebird.method)(function (recipeKeyString) {

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
    var task = new _dockerTasks.AppInstallTask(recipe);
    (0, _reducers.storeDispatch)({
      type: 'TASK_ADD',
      task: task
    });
  });

  return function appInstall(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var initAsync = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
    var daemon, agent, lastUsedVolume, storage, volume;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return new _bluebird2.default(function (resolve, reject) {
              _child_process2.default.exec('mkdir -p /run/wisnuc/app', function (err, stdout, stderr) {
                err ? reject(stderr) : resolve(stdout);
              });
            });

          case 2:
            _context2.next = 4;
            return probeDaemon();

          case 4:
            daemon = _context2.sent;

            if (!daemon.running) {
              _context2.next = 12;
              break;
            }

            info('daemon already running with pid ' + daemon.pid + ' and volume ' + daemon.volume);

            _context2.next = 9;
            return (0, _dockerEvents.dockerEventsAgent)();

          case 9:
            agent = _context2.sent;

            dispatchDaemonStart(daemon.volume, agent);
            return _context2.abrupt('return');

          case 12:
            lastUsedVolume = (0, _appifiConfig.getConfig)('lastUsedVolume');

            if (lastUsedVolume) {
              _context2.next = 16;
              break;
            }

            info('last used volume not set, docker daemon not started');
            return _context2.abrupt('return');

          case 16:
            if ((0, _reducers.storeState)().storage) {
              _context2.next = 22;
              break;
            }

            info('wait 500ms for storage module init');
            _context2.next = 20;
            return (0, _utils.delay)(500);

          case 20:
            _context2.next = 16;
            break;

          case 22:
            storage = (0, _reducers.storeState)().storage;
            volume = storage.volumes.find(function (vol) {
              return vol.uuid === lastUsedVolume;
            });

            if (volume) {
              _context2.next = 27;
              break;
            }

            info('last used volume (' + lastUsedVolume + ') not found, docker daemon not started');
            return _context2.abrupt('return');

          case 27:
            if (!volume.missing) {
              _context2.next = 30;
              break;
            }

            info('last used volume (' + lastUsedVolume + ') has missing drive, docker daemon not started');
            return _context2.abrupt('return');

          case 30:
            _context2.next = 32;
            return daemonStart(volume.uuid);

          case 32:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function initAsync() {
    return _ref3.apply(this, arguments);
  };
}();

var daemonStartOp = function () {
  var _ref4 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(uuid) {
    var storage, volume;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(0, _reducers.storeState)().docker) {
              _context3.next = 2;
              break;
            }

            throw new Error('daemon already started');

          case 2:
            storage = (0, _reducers.storeState)().storage;
            volume = storage.volumes.find(function (vol) {
              return vol.uuid === uuid;
            });

            if (volume) {
              _context3.next = 6;
              break;
            }

            throw new Error('volume not found');

          case 6:
            if (!volume.missing) {
              _context3.next = 8;
              break;
            }

            throw new Error('volume missing');

          case 8:
            _context3.next = 10;
            return daemonStart(volume.uuid);

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function daemonStartOp(_x3) {
    return _ref4.apply(this, arguments);
  };
}();

var containerDeleteCommand = function () {
  var _ref5 = (0, _bluebird.method)(function (id) {

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

    (0, _dockerapi.containerDelete)(id).then(function (r) {
      console.log(r);
      info('containerDelete ' + id + ' success');
    }).catch(function (e) {
      info('containerDelete ' + id + ' failed, error: ' + e.errno + ' ' + e.message);
    });
  });

  return function containerDeleteCommand(_x4) {
    return _ref5.apply(this, arguments);
  };
}();

var installedStart = function () {
  var _ref6 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(uuid) {
    var state, installeds, installed, container;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:

            info('installedStart uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context4.next = 4;
              break;
            }

            return _context4.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context4.next = 8;
              break;
            }

            return _context4.abrupt('return', { errno: -1 });

          case 8:
            container = (0, _dockerApps.appMainContainer)(installed);

            if (!(container && container.Id)) {
              _context4.next = 12;
              break;
            }

            _context4.next = 12;
            return (0, _dockerapi.containerStart)(container.Id);

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function installedStart(_x5) {
    return _ref6.apply(this, arguments);
  };
}();

var installedStop = function () {
  var _ref7 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(uuid) {
    var state, installeds, installed, container;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:

            info('installedStop uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context5.next = 4;
              break;
            }

            return _context5.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context5.next = 8;
              break;
            }

            return _context5.abrupt('return', { errno: -1 });

          case 8:
            container = (0, _dockerApps.appMainContainer)(installed);

            if (!(container && container.Id)) {
              _context5.next = 12;
              break;
            }

            _context5.next = 12;
            return (0, _dockerapi.containerStop)(container.Id);

          case 12:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function installedStop(_x6) {
    return _ref7.apply(this, arguments);
  };
}();

var appUninstall = function () {
  var _ref8 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(uuid) {
    var state, installeds, installed, containers, i, _i;

    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:

            info('appUninstall uuid: ' + uuid);

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
            containers = installed.containers;
            i = 0;

          case 10:
            if (!(i < containers.length)) {
              _context6.next = 16;
              break;
            }

            _context6.next = 13;
            return (0, _dockerapi.containerStop)(containers[i].Id);

          case 13:
            i++;
            _context6.next = 10;
            break;

          case 16:
            _i = 0;

          case 17:
            if (!(_i < containers.length)) {
              _context6.next = 23;
              break;
            }

            _context6.next = 20;
            return (0, _dockerapi.containerDelete)(containers[_i].Id);

          case 20:
            _i++;
            _context6.next = 17;
            break;

          case 23:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function appUninstall(_x7) {
    return _ref8.apply(this, arguments);
  };
}();

var operationAsync = function () {
  var _ref9 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee7(req) {
    var f, args;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:

            info('operation: ' + req.operation);

            f = void 0, args = void 0;

            if (!(req && req.operation)) {
              _context7.next = 26;
              break;
            }

            args = req.args && Array.isArray(req.args) ? req.args : [];
            _context7.t0 = req.operation;
            _context7.next = _context7.t0 === 'daemonStart' ? 7 : _context7.t0 === 'daemonStop' ? 9 : _context7.t0 === 'containerStart' ? 11 : _context7.t0 === 'containerStop' ? 13 : _context7.t0 === 'containerDelete' ? 15 : _context7.t0 === 'installedStart' ? 17 : _context7.t0 === 'installedStop' ? 19 : _context7.t0 === 'appInstall' ? 21 : _context7.t0 === 'appUninstall' ? 23 : 25;
            break;

          case 7:
            f = daemonStartOp;
            return _context7.abrupt('break', 26);

          case 9:
            f = daemonStop;
            return _context7.abrupt('break', 26);

          case 11:
            f = _dockerapi.containerStart;
            return _context7.abrupt('break', 26);

          case 13:
            f = _dockerapi.containerStop;
            return _context7.abrupt('break', 26);

          case 15:
            f = containerDeleteCommand;
            return _context7.abrupt('break', 26);

          case 17:
            f = installedStart;
            return _context7.abrupt('break', 26);

          case 19:
            f = installedStop;
            return _context7.abrupt('break', 26);

          case 21:
            f = appInstall;
            return _context7.abrupt('break', 26);

          case 23:
            f = appUninstall;
            return _context7.abrupt('break', 26);

          case 25:
            info('operation not implemented, ' + req.operation);

          case 26:
            if (!f) {
              _context7.next = 29;
              break;
            }

            _context7.next = 29;
            return f.apply(undefined, (0, _toConsumableArray3.default)(args));

          case 29:
            return _context7.abrupt('return', null);

          case 30:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function operationAsync(_x8) {
    return _ref9.apply(this, arguments);
  };
}();

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _utils = require('../lib/utils');

var _reduced = require('../lib/reduced');

var _appstore = require('./appstore');

var _appstore2 = _interopRequireDefault(_appstore);

var _dockerapi = require('./dockerapi');

var _appifiConfig = require('./appifiConfig');

var _dockerEvents = require('./dockerEvents');

var _dockerTasks = require('./dockerTasks');

var _dockerApps = require('./dockerApps');

var _reducers = require('../lib/reducers');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO

var debug = (0, _debug2.default)('docker');

var dockerUrl = 'http://127.0.0.1:1688';
var dockerPidFile = '/run/wisnuc/app/docker.pid';
var dockerVolumesDir = '/run/wisnuc/volumes';

var dockerAppdataDir = function dockerAppdataDir() {
  if (!(0, _reducers.storeState)().docker || !(0, _reducers.storeState)().docker.volume) return null;
  return dockerVolumesDir + '/' + (0, _reducers.storeState)().docker.volume + '/wisnuc/appdata';
};

var dockerFruitmixDir = function dockerFruitmixDir() {

  if (!(0, _reducers.storeState)().docker || !(0, _reducers.storeState)().docker.volume) return null;
  return dockerVolumesDir + '/' + (0, _reducers.storeState)().docker.volume + '/wisnuc/fruitmix';
};

// TODO change to debug module
var info = function info(message) {
  return console.log('[docker] ' + message);
};

var mkdirpAsync = (0, _bluebird.promisify)(_mkdirp2.default);
(0, _bluebird.promisifyAll)(_fs2.default);

var probeDaemon2 = function probeDaemon2(callback) {
  _superagent2.default.get('http://localhost:1688/info').set('Accept', 'application/json').end(function (err, res) {
    if (err || !res.ok) {
      callback(null, { running: false });
    } else {
      var volume = res.body.DockerRootDir.split('/')[4];
      console.log('probeDaemon Success, volume: ' + volume);
      callback(null, {
        running: true,
        volume: volume
      });
    }
  });
};

var probeDaemon = (0, _bluebird.promisify)(probeDaemon2);

function dispatchDaemonStart(volume, agent) {

  var events = new _dockerEvents.DockerEvents(agent);
  events.on('update', function (state) {
    (0, _reducers.storeDispatch)({
      type: 'DOCKER_UPDATE',
      data: state
    });
  });

  events.on('end', function () {
    (0, _reducers.storeDispatch)({
      type: 'DAEMON_STOP'
    });
  });

  (0, _appifiConfig.setConfig)('lastUsedVolume', volume);

  (0, _reducers.storeDispatch)({
    type: 'DAEMON_START',
    data: { volume: volume, events: events }
  });
}

var daemonStop2 = function daemonStop2(volume, callback) {

  _fs2.default.readFile('/run/wisnuc/app/docker.pid', function (err, data) {

    if (err && err.code === 'ENOENT') return callback(null);else if (err) {
      return callback(err);
    } else {
      (function () {
        var pid = parseInt(data.toString());
        process.kill(pid);

        var timer = setInterval(function () {
          try {
            process.kill(pid, 0);
          } catch (e) {
            // supposed error code is 'ESRCH', see man 2 kill
            clearInterval(timer);
            callback();
          }
        }, 1000);
      })();
    }
  });
};

var daemonStop = (0, _bluebird.promisify)(daemonStop2);

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

  init: function init() {
    initAsync().then(function (r) {
      // r undefined
      info('initialized');
      debug('docker initialized');
    }).catch(function (e) {
      info('ERROR: init failed');
      console.log(e);
    });
  },

  operation: function operation(req, callback) {
    operationAsync(req).then(function (r) {
      console.log(r);
      r instanceof Error ? callback(r) : callback(null, r);
    }).catch(function (e) {
      info('' + e.message);
      callback(e);
    });
  }
};
exports.daemonStart = daemonStart;
exports.daemonStop = daemonStop;
exports.daemonStartOp = daemonStartOp;
exports.containerStart = _dockerapi.containerStart;
exports.containerStop = _dockerapi.containerStop;
exports.containerDelete = _dockerapi.containerDelete;
exports.installedStart = installedStart;
exports.installedStop = installedStop;
exports.appInstall = appInstall;
exports.appUninstall = appUninstall;
exports.probeDaemon = probeDaemon;
exports.dockerAppdataDir = dockerAppdataDir;
exports.dockerFruitmixDir = dockerFruitmixDir;