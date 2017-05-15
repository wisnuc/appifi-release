'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _uuidlog = require('../lib/uuidlog');

var _uuidlog2 = _interopRequireDefault(_uuidlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = require('fs');
var path = require('path');

var dateFormat = require('dateformat');
var pidusage = require('pidusage');

// const readline = require('readline')

/**
 * this class recode filedata  probe count
 */
var Recorder = function () {
  function Recorder(dirpath, filedata, delay) {
    (0, _classCallCheck3.default)(this, Recorder);

    this.filedata = filedata;
    this.delay = delay || 1000;
    this.dirpath = dirpath;
    this.logger = (0, _uuidlog2.default)(dirpath);
  }

  (0, _createClass3.default)(Recorder, [{
    key: 'start',
    value: function start() {
      clearInterval(this.interval);
      this.interval = setInterval(this.recode.bind(this), this.delay);
    }

    // setTimer() {
    //   this.timer = setTimeout(() => {
    //     this.recode()
    //     this.setTimer()
    //   }, this.delay);
    // }

  }, {
    key: 'recode',
    value: function recode() {
      var _this = this;

      // time, total, now, cpu usage, memory usage, 
      pidusage.stat(process.pid, function (err, stat) {
        if (err) return;
        var time = dateFormat(new Date(), "yyyy-mm-dd hh:MM:ss TT");
        var total = _this.filedata.probeTotal;
        var now = _this.filedata.probeNow;
        var cpuUsage = stat.cpu.toFixed(2);
        var memoryUsage = (stat.memory / 1024 / 1024).toFixed(2);
        var text = time + ',' + total + ',' + now + ',' + cpuUsage + '%,' + memoryUsage + 'M';
        _this.logger.append('test.csv', text, function () {});
      });
    }
  }]);
  return Recorder;
}();

exports.default = Recorder;