'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.IBFDecode = exports.isZero = exports.IBFSubtract = exports.IBFEncode = exports.IBFRemove = exports.IBFInsert = exports.IBFUnion = exports.hashToDistinctIndices = exports.createIBF = undefined;

var _log = require('babel-runtime/core-js/math/log2');

var _log2 = _interopRequireDefault(_log);

var _xxhash = require('xxhash');

var _xxhash2 = _interopRequireDefault(_xxhash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hashpad = Buffer.alloc(4);

var createIBF = exports.createIBF = function createIBF(exponent, length, k, seed) {

  var n = Math.pow(2, exponent);
  var B = [];
  var hashPad = Buffer.alloc(4);

  for (var i = 0; i < n; i++) {
    B.push({
      idSum: Buffer.alloc(length),
      hashSum: Buffer.alloc(4),
      count: 0
    });
  }return { n: n, length: length, k: k, seed: seed, B: B };
};

var hashToDistinctIndices = exports.hashToDistinctIndices = function hashToDistinctIndices(id, k, n, seed) {

  var indices = [];
  var s = seed,
      idx = void 0;
  while (indices.length < k) {
    s = _xxhash2.default.hash(id, s);
    idx = s % n;
    if (!indices.find(function (i) {
      return i === idx;
    })) indices.push(idx);
  }
  return indices;
};

var IBFUnion = exports.IBFUnion = function IBFUnion(ibf, id, insert) {
  var m = void 0;var n = ibf.n;
  var length = ibf.length;
  var k = ibf.k;
  var seed = ibf.seed;
  var B = ibf.B;


  var indices = hashToDistinctIndices(id, k, n, seed);
  indices.forEach(function (j) {

    // B[j].idSum = B[j].idSum (+) id
    for (m = 0; m < length; m++) {
      B[j].idSum[m] ^= id[m];
    } // B[j].hashSum = B[j].hashSum (+) Hc(id)
    _xxhash2.default.hash(id, seed, hashpad);
    for (m = 0; m < 4; m++) {
      B[j].hashSum[m] ^= hashpad[m];
    }insert ? B[j].count += 1 : B[j].count -= 1;
  });
};

var IBFInsert = exports.IBFInsert = function IBFInsert(ibf, id) {
  return IBFUnion(ibf, id, true);
};
var IBFRemove = exports.IBFRemove = function IBFRemove(ibf, id) {
  return IBFUnion(ibf, id, false);
};

var IBFEncode = exports.IBFEncode = function IBFEncode(ibf, ids) {
  return ids.forEach(function (id) {
    return IBFInsert(ibf, id);
  });
};

var IBFSubtract = exports.IBFSubtract = function IBFSubtract(ibf1, ibf2) {

  var ibf = createIBF((0, _log2.default)(ibf1.n), ibf1.length, ibf1.k, ibf1.seed);

  var n = ibf.n;
  var length = ibf.length;
  var B = ibf.B;

  var B1 = ibf1.B,
      B2 = ibf2.B;
  var m = void 0;

  for (var i = 0; i < n; i++) {

    for (m = 0; m < length; m++) {
      B[i].idSum[m] = B1[i].idSum[m] ^ B2[i].idSum[m];
    }for (m = 0; m < 4; m++) {
      B[i].hashSum[m] = B1[i].hashSum[m] ^ B2[i].hashSum[m];
    }B[i].count = B1[i].count - B2[i].count;
  }

  return ibf;
};

var isPure = function isPure(u, seed) {
  var idSum = u.idSum;
  var hashSum = u.hashSum;
  var count = u.count;


  if (count === 1 || count === -1) {
    _xxhash2.default.hash(idSum, seed, hashpad);
    if (hashpad.equals(hashSum)) return true;
  }
  return false;
};

var isZero = exports.isZero = function isZero(ibf) {
  var i = void 0;var m = void 0;var n = ibf.n;
  var length = ibf.length;
  var B = ibf.B;

  for (i = 0; i < n; i++) {
    for (m = 0; m < length; m++) {
      if (B[i].idSum[m] !== 0) return false;
    }for (m = 0; m < 4; m++) {
      if (B[i].hashSum[m] !== 0) return false;
    }if (B[i].count !== 0) return false;
  }

  return true;
};

var IBFDecode = exports.IBFDecode = function IBFDecode(ibf) {
  var n = ibf.n;
  var length = ibf.length;
  var k = ibf.k;
  var seed = ibf.seed;
  var B = ibf.B;

  var pureList = [];
  var DAB = [],
      DBA = [];
  var m = void 0;

  for (var i = 0; i < n; i++) {
    if (isPure(B[i], seed)) pureList.push(i);
  }

  var _loop = function _loop() {

    var i = pureList.shift();
    if (!isPure(B[i], seed)) return 'continue';

    // keep a copy !
    var id = Buffer.from(B[i].idSum);
    var hash = Buffer.from(B[i].hashSum);
    var c = B[i].count;

    c > 0 ? DAB.push(id) : DBA.push(id);

    var indices = hashToDistinctIndices(id, k, n, seed);

    indices.forEach(function (j) {

      for (m = 0; m < length; m++) {
        B[j].idSum[m] ^= id[m];
      }_xxhash2.default.hash(id, seed, hashpad);
      for (m = 0; m < 4; m++) {
        B[j].hashSum[m] ^= hash[m];
      }B[j].count -= c;

      if (isPure(B[j], seed)) pureList.push(j);
    });
  };

  while (pureList.length) {
    var _ret = _loop();

    if (_ret === 'continue') continue;
  }

  ibf.decode = {
    positive: DAB,
    negative: DBA
  };

  return isZero(ibf);
};