'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var path = require('path');
var fs = require('fs');
var child = require('child_process');

var dminames = ['bios-vendor', 'bios-version', 'bios-release-date', 'system-manufacturer', 'system-product-name', 'system-version', 'system-serial-number', 'system-uuid', 'baseboard-manufacturer', 'baseboard-product-name', 'baseboard-version', 'baseboard-serial-number', 'baseboard-asset-tag', 'chassis-manufacturer', 'chassis-type', 'chassis-version', 'chassis-serial-number', 'chassis-asset-tag', 'processor-family', 'processor-manufacturer', 'processor-version', 'processor-frequency'];

// this function change string format 'processor-family' to js style 'processorFamily'
var stylize = function stylize(text) {
  return text.split(/[_\- ()]/).map(function (w, idx) {
    return idx === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1);
  }).join('');
};

var K = function K(x) {
  return function (y) {
    return x;
  };
};

var probeProcfs = function probeProcfs(path, cb) {
  return child.exec('cat /proc/' + path, function (err, stdout) {
    return err ? cb(err) : cb(null, stdout.toString().split('\n') // split to lines
    .map(function (l) {
      return l.trim();
    }).filter(function (l) {
      return l.length;
    }) // trim and remove empty line
    .map(function (l) {
      return l.split(':').map(function (w) {
        return w.trim();
      });
    }) // split to word array (kv)
    .filter(function (arr) {
      return arr.length === 2 && arr[0].length;
    }) // filter out non-kv
    .reduce(function (obj, arr) {
      return K(obj)(obj[stylize(arr[0])] = arr[1]);
    }, {}));
  });
}; // merge into one object

var probeProcfsMultiSec = function probeProcfsMultiSec(path, cb) {
  return child.exec('cat /proc/' + path, function (err, stdout) {
    return err ? cb(err) : cb(null, stdout.toString().split('\n\n') // split to sections
    .map(function (sect) {
      return sect.trim();
    }) // trim
    .filter(function (sect) {
      return sect.length;
    }) // remove last empty
    .map(function (sect) {
      return sect.split('\n') // process each section
      .map(function (l) {
        return l.trim();
      }).filter(function (l) {
        return l.length;
      }) // trim and remove empty line     
      .map(function (l) {
        return l.split(':').map(function (w) {
          return w.trim();
        });
      }) // split to word array (kv)     
      .filter(function (arr) {
        return arr.length === 2 && arr[0].length;
      }) // filter out non-kv     
      .reduce(function (obj, arr) {
        return K(obj)(obj[stylize(arr[0])] = arr[1]);
      }, {});
    }));
  });
}; // merge into one object 

var probeWs215i = function probeWs215i(cb) {
  return fs.stat('/proc/BOARD_io', function (err) {
    return err ? err.code === 'ENOENT' ? cb(null, false) : cb(err) : cb(null, true);
  });
};

// only for ws215i
var mtdDecode = function mtdDecode(cb) {

  var count = 3,
      serial = void 0,
      p2p = void 0,
      mac = void 0;
  var end = function end() {
    return ! --count && cb(null, { serial: serial, p2p: p2p, mac: mac });
  };

  child.exec('dd if=/dev/mtd0ro bs=1 skip=1697760 count=11', function (err, stdout) {
    return end(!err && (serial = stdout.toString()));
  });

  child.exec('dd if=/dev/mtd0ro bs=1 skip=1697664 count=20', function (err, stdout) {
    return end(!err && (p2p = stdout.toString()));
  });

  child.exec('dd if=/dev/mtd0ro bs=1 skip=1660976 count=6 | xxd -p', function (err, stdout) {
    return end(!err && (mac = stdout.trim().match(/.{2}/g).join(':')));
  });
};

var dmiDecode = function dmiDecode(cb) {

  var count = dminames.length,
      dmidecode = {};
  var end = function end() {
    return ! --count && cb(null, dmidecode);
  };

  dminames.forEach(function (name) {
    return child.exec('dmidecode -s ' + name, function (err, stdout) {
      return end(!err && stdout.length && (dmidecode[stylize(name)] = stdout.toString().split('\n')[0].trim()));
    });
  });
};

var systemProbe = function systemProbe(cb) {
  return probeProcfsMultiSec('cpuinfo', function (err, cpuInfo) {
    return err ? cb(err) : probeProcfs('meminfo', function (err, memInfo) {
      return err ? cb(err) : probeWs215i(function (err, isWs215i) {
        return err ? cb(err) : isWs215i ? mtdDecode(function (err, ws215i) {
          return err ? cb(err) : cb(null, { cpuInfo: cpuInfo, memInfo: memInfo, ws215i: ws215i });
        }) : dmiDecode(function (err, dmidecode) {
          return err ? cb(err) : cb(null, { cpuInfo: cpuInfo, memInfo: memInfo, dmidecode: dmidecode });
        });
      });
    });
  });
};

exports.default = systemProbe;