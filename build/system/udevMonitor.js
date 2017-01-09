'use strict';

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _child_process = require('child_process');

var _child_process2 = _interopRequireDefault(_child_process);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _storage = require('./storage');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UdevMonitor = function (_EventEmitter) {
  (0, _inherits3.default)(UdevMonitor, _EventEmitter);

  function UdevMonitor(rl) {
    (0, _classCallCheck3.default)(this, UdevMonitor);

    var _this = (0, _possibleConstructorReturn3.default)(this, (UdevMonitor.__proto__ || (0, _getPrototypeOf2.default)(UdevMonitor)).call(this));

    _this.rl = rl;
    _this.timer = -1;
    _this.queue = [];

    rl.on('line', function (line) {

      var t = line.trim();
      if (!t.endsWith('(block)')) return;

      var split = t.split(' ').map(function (x) {
        return x.trim();
      }).filter(function (x) {
        return !!x.length;
      });

      if (split.length !== 5 || split[0] !== 'UDEV' || split[2] !== 'add' && split[2] !== 'remove' || split[4] !== '(block)') return;

      var action = split[2];
      var blkpath = split[3];

      if (_this.timer !== -1) clearTimeout(_this.timer);

      _this.queue.push({ action: action, blkpath: blkpath });
      _this.timer = setTimeout(function () {
        _this.emit('events', _this.queue);
        _this.queue = [];
        _this.timer = -1;
      }, 150);
    });

    rl.on('close', function () {
      console.log('unexpected close of udev monitor');
    });
    return _this;
  }

  return UdevMonitor;
}(_events2.default);

var createUdevMonitor = function createUdevMonitor() {

  var spawn = _child_process2.default.spawn('stdbuf', ['-oL', 'udevadm', 'monitor', '--udev', '-s', 'block']);
  var rl = _readline2.default.createInterface({ input: spawn.stdout });

  return new UdevMonitor(rl);
};

var udevmon = createUdevMonitor();

udevmon.on('events', function (events) {

  console.log('udev events', events);

  var add = false;
  var remove = false;

  events.forEach(function (evt) {
    if (evt.action === 'add') add = true;
    if (evt.action === 'remove') remove = true;
  });

  if (add || remove) (0, _storage.refreshStorage)().then(function () {}).catch(function (e) {
    console.log('udevmon, refreshStorage error >>>>');
    console.log(e);
    console.log('udevmon, refreshStorage error <<<<');
  });
});