'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FILE = exports.DIR = undefined;

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DIR = {
  MODEL: 'models',
  DRIVE: 'drives',
  DOC: 'documents',
  FSHARE: 'fileShare',
  FSHAREARC: 'fileShareArchive',
  MSHARE: 'mediaShare',
  MSHAREARC: 'mediaShareArchive',
  MTALK: 'mediaTalk',
  MTALKARC: 'mediaTalkArchive',
  THUMB: 'thumbnail',
  LOG: 'log',
  ETC: 'etc',
  SMB: 'smb',
  TMP: 'tmp'
};

(0, _freeze2.default)(DIR);

var FILE = {
  NULLTIME: -9999
};

exports.DIR = DIR;
exports.FILE = FILE;