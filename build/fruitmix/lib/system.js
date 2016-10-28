'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _paths = require('./paths');

var _paths2 = _interopRequireDefault(_paths);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _userModel = require('../models/userModel');

var _driveModel = require('../models/driveModel');

var _filer = require('./filer');

var _repo = require('./repo');

var _uuidlog = require('./uuidlog');

var _uuidlog2 = _interopRequireDefault(_uuidlog);

var _documentStore = require('./documentStore');

var _mediaShareStore = require('./mediaShareStore');

var _mediaTalkStore = require('./mediaTalkStore');

var _media = require('./media');

var _media2 = _interopRequireDefault(_media);

var _thumbnail = require('./thumbnail');

var _thumbnail2 = _interopRequireDefault(_thumbnail);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var initAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(sysroot) {
    var modelPath, tmpPath, userModelPath, userModel, driveModelPath, driveModel, repo, thumbnailer, logpath, log, docstore, msstore, mtstore, media;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return _paths2.default.setRootAsync(sysroot);

          case 2:
            console.log('sysroot is set to ' + sysroot);

            modelPath = _paths2.default.get('models');
            tmpPath = _paths2.default.get('tmp');

            // create and set user model

            userModelPath = _path2.default.join(modelPath, 'users.json');
            _context.next = 8;
            return (0, _userModel.createUserModelAsync)(userModelPath, tmpPath);

          case 8:
            userModel = _context.sent;

            _models2.default.setModel('user', userModel);

            // create and set drive model
            driveModelPath = _path2.default.join(modelPath, 'drives.json');
            _context.next = 13;
            return (0, _driveModel.createDriveModelAsync)(driveModelPath, tmpPath);

          case 13:
            driveModel = _context.sent;

            _models2.default.setModel('drive', driveModel);

            // create repo
            repo = (0, _repo.createRepo)(driveModel);

            _models2.default.setModel('filer', repo.filer);
            _models2.default.setModel('repo', repo);
            repo.init(function (err) {
              return err ? console.log(err) : null;
            });

            // create thumbnailer facility
            thumbnailer = (0, _thumbnail2.default)();

            _models2.default.setModel('thumbnailer', thumbnailer);

            // create uuid log facility
            logpath = _paths2.default.get('log');
            log = (0, _uuidlog2.default)(logpath);

            _models2.default.setModel('log', log);

            // the following should be merged into media, like repo

            // create document store
            _context.next = 26;
            return (0, _bluebird.promisify)(_documentStore.createDocumentStore)();

          case 26:
            docstore = _context.sent;


            // create mediashare store
            msstore = (0, _mediaShareStore.createMediaShareStore)(docstore);
            mtstore = (0, _mediaTalkStore.createMediaTalkStore)(docstore);
            media = (0, _media2.default)(msstore, mtstore);

            _models2.default.setModel('media', media);

          case 31:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function initAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = {
  init: function init(sysroot, callback) {
    return initAsync(sysroot).asCallback(callback);
  }
};