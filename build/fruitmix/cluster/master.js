'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _modelService = require('../models/modelService');

var _modelService2 = _interopRequireDefault(_modelService);

var _documentStore = require('../lib/documentStore');

var _fileData = require('../file/fileData');

var _fileData2 = _interopRequireDefault(_fileData);

var _shareStore = require('../lib/shareStore');

var _fileShareData = require('../file/fileShareData');

var _fileShareService = require('../file/fileShareService');

var _fileService = require('../file/fileService');

var _fileService2 = _interopRequireDefault(_fileService);

var _mediaService = require('../media/mediaService');

var _mediaService2 = _interopRequireDefault(_mediaService);

var _mediaData = require('../media/mediaData');

var _mediaData2 = _interopRequireDefault(_mediaData);

var _mediaShareData = require('../media/mediaShareData');

var _mediaShareService = require('../media/mediaShareService');

var _transfer = require('../file/transfer');

var _transfer2 = _interopRequireDefault(_transfer);

var _recorder = require('../file/recorder');

var _recorder2 = _interopRequireDefault(_recorder);

var _thumb = require('../media/thumb');

var _thumb2 = _interopRequireDefault(_thumb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var mkdirpAsync = (0, _bluebird.promisify)(require('mkdirp'));

var makeDirectoriesAsync = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(froot) {
    var join;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _bluebird.resolve)(mkdirpAsync(froot));

          case 2:
            join = function join(sub) {
              return path.join(froot, sub);
            };

            _context.next = 5;
            return (0, _bluebird.resolve)((0, _bluebird.all)([mkdirpAsync(join('models')), mkdirpAsync(join('drives')), mkdirpAsync(join('documents')), mkdirpAsync(join('fileShare')), mkdirpAsync(join('fileShareArchive')), mkdirpAsync(join('mediaShare')), mkdirpAsync(join('mediaShareArchive')), mkdirpAsync(join('mediaTalk')), mkdirpAsync(join('mediaTalkArchive')), mkdirpAsync(join('thumbnail')), mkdirpAsync(join('log')), mkdirpAsync(join('etc')), mkdirpAsync(join('smb')), mkdirpAsync(join('tmp'))]));

          case 5:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function makeDirectoriesAsync(_x) {
    return _ref.apply(this, arguments);
  };
}();

exports.default = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2() {
  var froot, modelService, modelData, docStore, fileData, fileShareStore, fileShareData, fileShareService, fileService, mediaShareStore, mediaShareData, mediaData, mediaService, mediaShareService, transfer, isSendNotify, fruitmixStart, ipc;
  return _regenerator2.default.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          froot = _config2.default.path;
          _context2.next = 3;
          return (0, _bluebird.resolve)(makeDirectoriesAsync(froot));

        case 3:
          modelService = (0, _modelService2.default)(froot);
          modelData = modelService.modelData;
          _context2.next = 7;
          return (0, _bluebird.resolve)((0, _documentStore.createDocumentStoreAsync)(froot));

        case 7:
          docStore = _context2.sent;
          fileData = new _fileData2.default(path.join(froot, 'drives'), modelData);
          _context2.next = 11;
          return (0, _bluebird.resolve)((0, _shareStore.createFileShareStoreAsync)(froot, docStore));

        case 11:
          fileShareStore = _context2.sent;
          fileShareData = (0, _fileShareData.createFileShareData)(modelData, fileShareStore);
          fileShareService = (0, _fileShareService.createFileShareService)(fileData, fileShareData);
          fileService = new _fileService2.default(froot, fileData, fileShareData);
          _context2.next = 17;
          return (0, _bluebird.resolve)((0, _shareStore.createMediaShareStoreAsync)(froot, docStore));

        case 17:
          mediaShareStore = _context2.sent;
          mediaShareData = (0, _mediaShareData.createMediaShareData)(modelData, mediaShareStore);
          mediaData = new _mediaData2.default(modelData, fileData, fileShareData, mediaShareData);
          mediaService = new _mediaService2.default(modelData, fileData, fileShareData, mediaData, mediaShareData);
          mediaShareService = (0, _mediaShareService.createMediaShareService)(mediaData, mediaShareData);
          transfer = new _transfer2.default(fileData);
          // const recorder = new Recorder(path.join(froot, 'log'), fileData, 1000)
          // recorder.start()

          _context2.next = 25;
          return (0, _bluebird.resolve)(modelService.initializeAsync());

        case 25:

          console.log('modelData', modelData.users, modelData.drives);

          if (process.env.FORK) {
            isSendNotify = false;

            fruitmixStart = function fruitmixStart(args, callback) {
              if (isSendNotify) return callback();
              console.log('fruitmix started in forked mode');
              process.send({ type: 'fruitmixStarted' });
              isSendNotify = true;
              return callback();
            };

            _config2.default.ipc.register('fruitmixStart', fruitmixStart.bind(undefined));

            process.on('message', function (message) {
              switch (message.type) {
                case 'createFirstUser':
                  var username = message.username,
                      password = message.password;


                  console.log('start with creating first user mode');
                  modelService.createLocalUserAsync({ props: { type: 'local', username: username, password: password } }).asCallback(function (err, data) {
                    console.log('creating first user return', err || data);
                    process.send({ type: 'createFirstUserDone', err: err, data: data });
                  });
                  break;
                default:
                  break;
              }
            });
          } else {
            console.log('fruitmix started in standalone mode');
          }

          _context2.next = 29;
          return (0, _bluebird.resolve)(fileShareService.load());

        case 29:
          _context2.next = 31;
          return (0, _bluebird.resolve)(mediaShareService.load());

        case 31:
          ipc = _config2.default.ipc;

          ipc.register('ipctest', function (text, callback) {
            return process.nextTick(function () {
              return callback(null, text.toUpperCase());
            });
          });
          modelService.register(ipc);
          fileService.register(ipc);
          transfer.register(ipc);
          fileShareService.register(ipc);
          mediaShareService.register(ipc);
          mediaService.register(ipc);

        case 39:
        case 'end':
          return _context2.stop();
      }
    }
  }, _callee2, undefined);
}));