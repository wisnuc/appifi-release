'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteAliasAsync = exports.addAliasAsync = exports.aliases = exports.mac2dev = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _sysconfig = require('./sysconfig');

var _sysconfig2 = _interopRequireDefault(_sysconfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ip addr add ${ipaddr}/24 dev ${dev} label ${dev}:wisnuc
// ip addr del ${ipaddr}/24 dev ${dev}:wisnuc

var K = function K(x) {
  return function (y) {
    return x;
  };
};

var parseAliasing = function parseAliasing(net) {
  return (0, _keys2.default)(net).reduce(function (prev, curr, idx, arr) {
    return curr.endsWith(':app') && arr.indexOf(curr.slice(0, -4)) !== -1 ? [].concat((0, _toConsumableArray3.default)(prev), [{
      dev: curr.slice(0, -4),
      mac: net[curr.slice(0, -4)][0]['mac'],
      ipv4: net[curr][0]['address']
    }]) : prev;
  }, []);
};

var _mac2dev = function _mac2dev(net, mac) {
  for (var prop in net) {
    if (net.hasOwnProperty(prop) && prop.indexOf(':') === -1 && net[prop][0]['internal'] === false && net[prop][0]['mac'].toUpperCase() === mac.toUpperCase()) return prop;
  }
};

var mac2dev = function mac2dev(mac) {
  return _mac2dev(_os2.default.networkInterfaces(), mac);
};

var aliases = function aliases() {
  return parseAliasing(_os2.default.networkInterfaces());
};

var _addAlias = function _addAlias(dev, addr, callback) {
  return _child_process2.default.exec('ip addr add ' + addr + '/24 dev ' + dev + ' label ' + dev + ':app', function (err) {
    return callback(err);
  });
};

var addAlias = function addAlias(dev, addr, callback) {
  return _addAlias(dev, addr, function (err) {
    return err ? callback(err) : callback(K(null)(_sysconfig2.default.set('ipAliasing', aliases().map(function (alias) {
      return { mac: alias.mac, ipv4: alias.ipv4 };
    }))));
  });
};

var addAliasAsync = (0, _bluebird.promisify)(addAlias);

var _deleteAlias = function _deleteAlias(dev, addr, callback) {
  return _child_process2.default.exec('ip addr del ' + addr + '/24 dev ' + dev + ':wisnuc', function (err) {
    return callback(err);
  });
};

var deleteAlias = function deleteAlias(dev, addr, callback) {
  return _deleteAlias(dev, addr, function (err) {
    return err ? callback(err) : callback(K(null)(_sysconfig2.default.set('ipAliasing', aliases().map(function (alias) {
      return { mac: alias.mac, ipv4: alias.ipv4 };
    }))));
  });
};

var deleteAliasAsync = (0, _bluebird.promisify)(deleteAlias);

var init = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee() {
    var i, activated, config, common, net;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            i = void 0;
            activated = aliases();
            config = _sysconfig2.default.get('ipAliasing');

            // find common entries

            common = activated.filter(function (act) {
              return !!config.find(function (conf) {
                return act.mac === conf.mac && act.ipv4 === conf.ipv4;
              });
            });

            // remove common entries from both list

            activated = activated.filter(function (act) {
              return !common.find(function (s) {
                return s === act;
              });
            });
            config = config.filter(function (conf) {
              return !common.find(function (s) {
                return s.mac === conf.mac && s.ipv4 === conf.ipv4;
              });
            });

            // remove activated but not configured
            i = 0;

          case 7:
            if (!(i < activated.length)) {
              _context.next = 13;
              break;
            }

            _context.next = 10;
            return (0, _bluebird.promisify)(_deleteAlias)(activated[i].dev, activated[i].ipv4);

          case 10:
            i++;
            _context.next = 7;
            break;

          case 13:

            // add configured but not activated
            net = _os2.default.networkInterfaces();
            i = 0;

          case 15:
            if (!(i < config.length)) {
              _context.next = 21;
              break;
            }

            _context.next = 18;
            return (0, _bluebird.promisify)(_addAlias)(_mac2dev(net, config[i].mac), config[i].ipv4);

          case 18:
            i++;
            _context.next = 15;
            break;

          case 21:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function init() {
    return _ref.apply(this, arguments);
  };
}();

init().then(function () {
  console.log('ipaliasing initialized');
  console.log(aliases());
}).catch(function (e) {
  return console.log(e);
});

exports.mac2dev = mac2dev;
exports.aliases = aliases;
exports.addAliasAsync = addAliasAsync;
exports.deleteAliasAsync = deleteAliasAsync;