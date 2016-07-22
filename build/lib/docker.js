'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dockerAppdataDir = exports.probeDaemon = exports.appUninstall = exports.appInstall = exports.installedStop = exports.installedStart = exports.containerDelete = exports.containerStop = exports.containerStart = exports.daemonStartOp = exports.daemonStop = exports.daemonStart = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var mkdirpAsync = function () {
  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(dirpath) {
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt('return', new _bluebird2.default(function (resolve) {
              return (0, _mkdirp2.default)(dirpath, function (err) {
                return err ? resolve(err) : resolve(null);
              });
            }));

          case 1:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function mkdirpAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

/*
 * async function, return { running: false } or { running: true, pid, volume }, may return error
 * in future
 */


var probeDaemon = function () {
  var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return new _bluebird2.default(function (resolve) {
              // TODO never reject?
              _child_process2.default.exec('ps aux | grep docker | grep "docker daemon"', function (err, stdout) {
                // stderr not used

                /** the assumption is only one instance of daemon now **/
                var cmdline = (0, _utils.toLines)(stdout).find(function (line) {
                  /*  [ 'root', '12670', '0.0', '1.9', '555028', '39444', '?', 'Ssl', 'May03', '0:25', 'docker', 'daemon', // 12 total
                        '--exec-root="/run/wisnuc/volumes/da2ba49b-1d16-4f6e-8005-bfaedd110814/root"', 
                        '--graph="/run/wisnuc/volumes/da2ba49b-1d16-4f6e-8005-bfaedd110814/graph"',
                        '--host="127.0.0.1:1688"',
                        '--pidfile="/run/wisnuc/app/docker.pid"' ] */
                  // console.log(line)
                  var p = line.split(/\s+/);
                  // console.log(p)
                  if (p.length === 16 && p[10] === 'docker' && p[11] === 'daemon' && p[12].startsWith('--exec-root=/run/wisnuc/volumes/') && p[13].startsWith('--graph=/run/wisnuc/volumes/') && p[14] === '--host=127.0.0.1:1688' && p[15] === '--pidfile=/run/wisnuc/app/docker.pid') return true;
                  return false;
                });

                if (!cmdline) {
                  info('probeDaemon docker is not running');
                  return resolve({ running: false });
                }

                var p = cmdline.split(/\s+/);
                var pid = parseInt(p[1]);
                var pp = p[12].split(/\//);
                /**
                [ '--exec-root=',
                  'run',
                  'wisnuc',
                  'volumes',
                  'faa48687-8b84-42ce-b625-ab49cf9e7830',
                  'wisnuc',
                  'docker',
                  'root' ]
                **/

                var volume = pp[4];

                info('probeDaemon, docker is running with pid: ' + pid + ', volume:' + volume);
                resolve({ running: true, pid: pid, volume: volume });
              });
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

  return function probeDaemon() {
    return _ref2.apply(this, arguments);
  };
}();

/*
 * return {pid, volume, listener} or null
 */

var daemonStart = function () {
  var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(uuid) {
    var out, err, mountpoint, execRootDir, graphDir, appDataDir, opts, args, dockerDaemon, agent;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            out = _fs2.default.openSync('/dev/null', 'w');
            err = _fs2.default.openSync('/dev/null', 'w');
            mountpoint = dockerVolumesDir + '/' + uuid;
            execRootDir = mountpoint + '/wisnuc/r';
            graphDir = mountpoint + '/wisnuc/g';
            appDataDir = dockerVolumesDir + '/' + uuid + '/wisnuc/appdata';
            _context3.next = 8;
            return mkdirpAsync(execRootDir);

          case 8:
            _context3.next = 10;
            return mkdirpAsync(graphDir);

          case 10:
            _context3.next = 12;
            return mkdirpAsync(appDataDir);

          case 12:
            opts = {
              cwd: mountpoint,
              detached: true,
              stdio: ['ignore', out, err]
            };
            args = ['daemon',
            //    `--exec-root=${mountpoint}/root`,
            //    `--graph=${mountpoint}/graph`,
            '--exec-root=' + execRootDir, '--graph=' + graphDir, '--host=127.0.0.1:1688', '--pidfile=' + dockerPidFile];
            dockerDaemon = _child_process2.default.spawn('docker', args, opts);

            dockerDaemon.on('exit', function (code, signal) {
              dockerDaemon = null;
              if (code !== undefined) console.log('daemon exits with exitcode ' + code);
              if (signal !== undefined) console.log('daemon exits with signal ' + signal);
            });

            _context3.next = 18;
            return (0, _utils.delay)(3000);

          case 18:
            if (!(dockerDaemon === null)) {
              _context3.next = 20;
              break;
            }

            throw 'docker daemon stopped right after started';

          case 20:
            dockerDaemon.unref();

            _context3.next = 23;
            return (0, _dockerEvents.dockerEventsAgent)();

          case 23:
            agent = _context3.sent;

            dispatchDaemonStart(dockerDaemon.pid, uuid, agent);

          case 25:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function daemonStart(_x2) {
    return _ref3.apply(this, arguments);
  };
}();

/*
 * kill daemon anyway; TODO be nicer
 */


var daemonStop = function () {
  var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
    var daemon;
    return _regenerator2.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return probeDaemon();

          case 2:
            daemon = _context4.sent;

            if (daemon.running) {
              info('sending term signal to ' + daemon.pid);
              process.kill(daemon.pid);
            }

            _context4.next = 6;
            return (0, _utils.delay)(2000);

          case 6:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function daemonStop() {
    return _ref4.apply(this, arguments);
  };
}();

var appInstall = function () {
  var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(recipeKeyString) {
    var status, appstore, recipe, tasks, stopped, task;
    return _regenerator2.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:

            // check if installed or installing
            status = appStatus(recipeKeyString);

            if (!(status !== 'NOTFOUND')) {
              _context5.next = 4;
              break;
            }

            info(recipeKeyString + ' status: ' + status + ', install rejected');
            return _context5.abrupt('return');

          case 4:

            // retrieve recipe
            appstore = (0, _reducers.storeState)().appstore.result;

            if (!(!appstore || !appstore.recipes)) {
              _context5.next = 8;
              break;
            }

            info('recipes unavail, failed to install ' + appname + ' (' + recipeKeyString + ')');
            return _context5.abrupt('return');

          case 8:
            recipe = appstore.recipes.find(function (r) {
              return (0, _dockerApps.calcRecipeKeyString)(r) === recipeKeyString;
            });

            if (recipe) {
              _context5.next = 12;
              break;
            }

            info('recipe not found: ' + recipeKeyString + ', install app failed');
            return _context5.abrupt('return');

          case 12:

            // remove existing tasks if any
            tasks = (0, _reducers.storeState)().tasks;
            stopped = tasks.filter(function (t) {
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
            task = new _dockerTasks.AppInstallTask(recipe);

            (0, _reducers.storeDispatch)({
              type: 'TASK_ADD',
              task: task
            });

          case 17:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function appInstall(_x3) {
    return _ref5.apply(this, arguments);
  };
}();

var _init = function () {
  var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
    var daemon, agent, lastUsedVolume, storage, volume;
    return _regenerator2.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return new _bluebird2.default(function (resolve, reject) {
              _child_process2.default.exec('mkdir -p /run/wisnuc/app', function (err, stdout, stderr) {
                err ? reject(stderr) : resolve(stdout);
              });
            });

          case 2:
            _context6.next = 4;
            return probeDaemon();

          case 4:
            daemon = _context6.sent;

            if (!daemon.running) {
              _context6.next = 12;
              break;
            }

            info('daemon already running with pid ' + daemon.pid + ' and volume ' + daemon.volume);

            _context6.next = 9;
            return (0, _dockerEvents.dockerEventsAgent)();

          case 9:
            agent = _context6.sent;

            dispatchDaemonStart(daemon.pid, daemon.volume, agent);
            return _context6.abrupt('return');

          case 12:
            lastUsedVolume = (0, _appifiConfig.getConfig)('lastUsedVolume');

            if (lastUsedVolume) {
              _context6.next = 16;
              break;
            }

            info('last used volume not set, docker daemon not started');
            return _context6.abrupt('return');

          case 16:
            if ((0, _reducers.storeState)().storage) {
              _context6.next = 22;
              break;
            }

            info('wait 500ms for storage module init');
            _context6.next = 20;
            return (0, _utils.delay)(500);

          case 20:
            _context6.next = 16;
            break;

          case 22:
            storage = (0, _reducers.storeState)().storage;
            volume = storage.volumes.find(function (vol) {
              return vol.uuid === lastUsedVolume;
            });

            if (volume) {
              _context6.next = 27;
              break;
            }

            info('last used volume (' + lastUsedVolume + ') not found, docker daemon not started');
            return _context6.abrupt('return');

          case 27:
            if (!volume.missing) {
              _context6.next = 30;
              break;
            }

            info('last used volume (' + lastUsedVolume + ') has missing drive, docker daemon not started');
            return _context6.abrupt('return');

          case 30:
            _context6.next = 32;
            return daemonStart(volume.uuid);

          case 32:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function _init() {
    return _ref6.apply(this, arguments);
  };
}();

var daemonStartOp = function () {
  var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(uuid) {
    var storage, volume;
    return _regenerator2.default.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (!(0, _reducers.storeState)().docker) {
              _context7.next = 2;
              break;
            }

            throw new Error('daemon already started');

          case 2:
            storage = (0, _reducers.storeState)().storage;
            volume = storage.volumes.find(function (vol) {
              return vol.uuid === uuid;
            });

            if (volume) {
              _context7.next = 6;
              break;
            }

            throw new Error('volume not found');

          case 6:
            if (!volume.missing) {
              _context7.next = 8;
              break;
            }

            throw new Error('volume missing');

          case 8:
            _context7.next = 10;
            return daemonStart(volume.uuid);

          case 10:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, this);
  }));

  return function daemonStartOp(_x4) {
    return _ref7.apply(this, arguments);
  };
}();

var containerDeleteCommand = function () {
  var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(id) {
    var docker, installeds, inst;
    return _regenerator2.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            docker = (0, _reducers.storeState)().docker;

            if (!(!docker || !docker.computed || !docker.computed.installeds)) {
              _context8.next = 3;
              break;
            }

            return _context8.abrupt('return', null);

          case 3:
            installeds = docker.computed.installeds;


            console.log('>>>>');
            installeds.forEach(function (inst) {
              return console.log(inst.containers);
            });
            console.log('<<<<');

            inst = installeds.find(function (i) {
              return i.containers.find(function (c) {
                return c.Id === id;
              }) ? true : false;
            });

            if (!inst) {
              _context8.next = 11;
              break;
            }

            info('container in apps cannot be deleted directly');
            return _context8.abrupt('return', null);

          case 11:

            (0, _dockerapi.containerDelete)(id).then(function (r) {
              console.log(r);
              info('containerDelete ' + id + ' success');
            }).catch(function (e) {
              info('containerDelete ' + id + ' failed, error: ' + e.errno + ' ' + e.message);
            });

          case 12:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function containerDeleteCommand(_x5) {
    return _ref8.apply(this, arguments);
  };
}();

var installedStart = function () {
  var _ref9 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(uuid) {
    var state, installeds, installed, container;
    return _regenerator2.default.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:

            info('installedStart uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context9.next = 4;
              break;
            }

            return _context9.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context9.next = 8;
              break;
            }

            return _context9.abrupt('return', { errno: -1 });

          case 8:
            container = (0, _dockerApps.appMainContainer)(installed);

            if (!(container && container.Id)) {
              _context9.next = 12;
              break;
            }

            _context9.next = 12;
            return (0, _dockerapi.containerStart)(container.Id);

          case 12:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, this);
  }));

  return function installedStart(_x6) {
    return _ref9.apply(this, arguments);
  };
}();

var installedStop = function () {
  var _ref10 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(uuid) {
    var state, installeds, installed, container;
    return _regenerator2.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:

            info('installedStop uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context10.next = 4;
              break;
            }

            return _context10.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context10.next = 8;
              break;
            }

            return _context10.abrupt('return', { errno: -1 });

          case 8:
            container = (0, _dockerApps.appMainContainer)(installed);

            if (!(container && container.Id)) {
              _context10.next = 12;
              break;
            }

            _context10.next = 12;
            return (0, _dockerapi.containerStop)(container.Id);

          case 12:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function installedStop(_x7) {
    return _ref10.apply(this, arguments);
  };
}();

var appUninstall = function () {
  var _ref11 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11(uuid) {
    var state, installeds, installed, containers, i, _i;

    return _regenerator2.default.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:

            info('appUninstall uuid: ' + uuid);

            state = (0, _reducers.storeState)();

            if (!(state.docker === null || state.docker.data === null || state.docker.data.containers === null || state.docker.computed === null || !state.docker.computed.installeds)) {
              _context11.next = 4;
              break;
            }

            return _context11.abrupt('return', { errno: -1 });

          case 4:
            installeds = state.docker.computed.installeds;
            installed = installeds.find(function (inst) {
              return inst.uuid === uuid;
            });

            if (installed) {
              _context11.next = 8;
              break;
            }

            return _context11.abrupt('return', { errno: -1 });

          case 8:
            containers = installed.containers;
            i = 0;

          case 10:
            if (!(i < containers.length)) {
              _context11.next = 16;
              break;
            }

            _context11.next = 13;
            return (0, _dockerapi.containerStop)(containers[i].Id);

          case 13:
            i++;
            _context11.next = 10;
            break;

          case 16:
            _i = 0;

          case 17:
            if (!(_i < containers.length)) {
              _context11.next = 23;
              break;
            }

            _context11.next = 20;
            return (0, _dockerapi.containerDelete)(containers[_i].Id);

          case 20:
            _i++;
            _context11.next = 17;
            break;

          case 23:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, this);
  }));

  return function appUninstall(_x8) {
    return _ref11.apply(this, arguments);
  };
}();

var operationAsync = function () {
  var _ref12 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12(req) {
    var f, args;
    return _regenerator2.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:

            info('operation: ' + req.operation);

            f = void 0, args = void 0;

            if (!(req && req.operation)) {
              _context12.next = 26;
              break;
            }

            args = req.args && Array.isArray(req.args) ? req.args : [];
            _context12.t0 = req.operation;
            _context12.next = _context12.t0 === 'daemonStart' ? 7 : _context12.t0 === 'daemonStop' ? 9 : _context12.t0 === 'containerStart' ? 11 : _context12.t0 === 'containerStop' ? 13 : _context12.t0 === 'containerDelete' ? 15 : _context12.t0 === 'installedStart' ? 17 : _context12.t0 === 'installedStop' ? 19 : _context12.t0 === 'appInstall' ? 21 : _context12.t0 === 'appUninstall' ? 23 : 25;
            break;

          case 7:
            f = daemonStartOp;
            return _context12.abrupt('break', 26);

          case 9:
            f = daemonStop;
            return _context12.abrupt('break', 26);

          case 11:
            f = _dockerapi.containerStart;
            return _context12.abrupt('break', 26);

          case 13:
            f = _dockerapi.containerStop;
            return _context12.abrupt('break', 26);

          case 15:
            f = containerDeleteCommand;
            return _context12.abrupt('break', 26);

          case 17:
            f = installedStart;
            return _context12.abrupt('break', 26);

          case 19:
            f = installedStop;
            return _context12.abrupt('break', 26);

          case 21:
            f = appInstall;
            return _context12.abrupt('break', 26);

          case 23:
            f = appUninstall;
            return _context12.abrupt('break', 26);

          case 25:
            info('operation not implemented, ' + req.operation);

          case 26:
            if (!f) {
              _context12.next = 29;
              break;
            }

            _context12.next = 29;
            return f.apply(undefined, (0, _toConsumableArray3.default)(args));

          case 29:
            return _context12.abrupt('return', null);

          case 30:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function operationAsync(_x9) {
    return _ref12.apply(this, arguments);
  };
}();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

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

var dockerUrl = 'http://127.0.0.1:1688';
var dockerPidFile = '/run/wisnuc/app/docker.pid';
var dockerVolumesDir = '/run/wisnuc/volumes';

var dockerAppdataDir = function dockerAppdataDir() {

  if (!(0, _reducers.storeState)().docker || !(0, _reducers.storeState)().docker.volume) return null;
  return dockerVolumesDir + '/' + (0, _reducers.storeState)().docker.volume + '/wisnuc/appdata';
};

function info(message) {
  console.log('[docker] ' + message);
}

function dispatchDaemonStart(pid, volume, agent) {

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
    data: { pid: pid, volume: volume, events: events }
  });
}

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
    _init().then(function (r) {
      // r undefined
      info('initialized');
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