'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _advertiser = require('./advertiser');

var _advertiser2 = _interopRequireDefault(_advertiser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('appifi:dockerStateObserver');

var appifiAdvertiser = (0, _advertiser2.default)('WISNUC AppStation', 3000);

var appAdvertisers = [];

// used for map // TODO why placed here
var openable = function openable(installed) {

  var container = installed.containers[0];
  if (container.State !== 'running') return null;

  var Ports = container.Ports;
  if (!Ports || !Array.isArray(Ports) || Ports.length === 0) return null;

  // { IP: '0.0.0.0', PrivatePort: 80, PublicPort: 10088, Type: 'tcp' }
  var Port = Ports.find(function (p) {
    return p.Type === 'tcp' && p.PublicPort !== undefined;
  });
  if (!Port) return null;

  // console.log(typeof Port.PublicPort) is 'number' 
  return {
    appname: installed.recipe.appname,
    open: Port.PublicPort
  };
};

var removeAdvertising = function removeAdvertising(advertising, services) {

  var survive = [];

  // find existing advertiser and stop it
  advertising.forEach(function (adv) {

    if (services.find(function (srv) {
      return srv.appname === adv.name && srv.open === adv.port;
    })) {
      survive.push(adv);
    } else {
      adv.abort();
    }
  });

  return survive;
};

var addAdvertising = function addAdvertising(advertising, services) {

  var newServices = services.filter(function (srv) {
    if (advertising.find(function (adv) {
      return adv.name === srv.appname && adv.port === srv.open;
    })) return false;
    return true;
  });

  newServices.forEach(function (srv) {
    var adv = (0, _advertiser2.default)(srv.appname, srv.open);
    advertising.push(adv);
  });

  return advertising;
};

var dockerStateObserver = function dockerStateObserver(newState, state) {

  if (newState !== null && newState.data !== null && newState.computed !== null) {

    var services = newState.computed.installeds.map(function (inst) {
      return openable(inst);
    }).filter(function (obj) {
      return obj !== null;
    });

    var survive = removeAdvertising(appAdvertisers, services);
    appAdvertisers = addAdvertising(survive, services);
  }
};

exports.default = dockerStateObserver;