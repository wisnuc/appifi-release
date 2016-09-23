'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (magic) {

  var meta = {};
  if (magic.startsWith('JPEG image data')) {

    meta.type = 'JPEG';

    var regex = /Exif Standard: \[(.*?)\], /i;
    var exif = regex.exec(magic);
    var sliced = exif ? magic.slice(0, exif.index) + magic.slice(exif.index + exif[0].length) : null;
    var datetime = null;
    if (exif) {
      var arr = exif[1].split(',').map(function (i) {
        return i.trim();
      });
      var dtStr = arr.find(function (l) {
        return (/^datetime=\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(l)
        );
      });
      if (dtStr) datetime = dtStr.slice(9);
    }

    // remove exif bracket and split
    // let items = magic.replace(/\[.*\]/g, '').split(',').map(item => item.trim())
    var items = (exif ? sliced : magic).split(',').map(function (item) {
      return item.trim();
    });

    // find width x height
    var x = items.find(function (item) {
      return (/^\d+x\d+$/.test(item)
      );
    });
    if (!x) return null;

    var y = x.split('x');
    meta.width = parseInt(y[0]);
    meta.height = parseInt(y[1]);
    meta.datetime = datetime ? datetime : null;
    meta.extended = exif ? true : false;

    return meta; // type = JPEG, width, height, extended
  }
  return null;
};