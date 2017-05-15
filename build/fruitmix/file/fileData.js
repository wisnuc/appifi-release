'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _error = require('../lib/error');

var _error2 = _interopRequireDefault(_error);

var _xstat = require('./xstat');

var _async = require('../util/async');

var _node = require('./node');

var _node2 = _interopRequireDefault(_node);

var _driveNode = require('./driveNode');

var _driveNode2 = _interopRequireDefault(_driveNode);

var _fileNode = require('./fileNode');

var _fileNode2 = _interopRequireDefault(_fileNode);

var _directoryNode = require('./directoryNode');

var _directoryNode2 = _interopRequireDefault(_directoryNode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FileData = function (_EventEmitter) {
  (0, _inherits3.default)(FileData, _EventEmitter);

  function FileData(driveDir, model) {
    (0, _classCallCheck3.default)(this, FileData);

    var _this = (0, _possibleConstructorReturn3.default)(this, (FileData.__proto__ || (0, _getPrototypeOf2.default)(FileData)).call(this));

    _this.dir = driveDir;
    _this.model = model;
    _this.root = new _node2.default(_this);
    _this.uuidMap = new _map2.default();
    _this.probeTotal = 0;
    _this.probeNow = 0;

    // drives created and deleted are processed in batch
    // it is easier to do assertion after change
    model.on('drivesCreated', function (drives) {
      return _this.createDrives(drives);
    });

    model.on('drivesDeleted', function (drives) {
      return _this.deleteDrives(drives);
    });

    model.on('driveUpdated', function (drive) {
      return _this.updateDriveAsync(drive);
    });
    return _this;
  }

  (0, _createClass3.default)(FileData, [{
    key: 'createDrives',
    value: function createDrives(drives) {
      var _this2 = this;

      drives.forEach(function () {
        var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(drv) {
          var target, xstat, drvNode;
          return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  target = _path2.default.join(_this2.dir, drv.uuid);
                  _context.next = 3;
                  return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(target));

                case 3:
                  _context.next = 5;
                  return (0, _bluebird.resolve)((0, _xstat.forceDriveXstatAsync)(target, drv.uuid));

                case 5:
                  xstat = _context.sent;
                  drvNode = new _driveNode2.default(_this2, xstat, drv);

                  drvNode.attach(_this2.root);

                case 8:
                case 'end':
                  return _context.stop();
              }
            }
          }, _callee, _this2);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }
  }, {
    key: 'deleteDrives',
    value: function deleteDrives(drives) {
      this.root.getChilren.filter(function (node) {
        return drives.map(function (d) {
          return d.uuid;
        }).includes(node.uuid);
      }).forEach(function (node) {
        return node.detach();
      });
    }
  }, {
    key: 'updateDriveAsync',
    value: function () {
      var _ref2 = (0, _bluebird.method)(function (drive) {
        var node = this.root.getChildren().find(function (n) {
          return n.uuid === drive.uuid;
        });
        if (node) node.updateDrive(drive);
      });

      function updateDriveAsync(_x2) {
        return _ref2.apply(this, arguments);
      }

      return updateDriveAsync;
    }()
  }, {
    key: 'nodeAttached',
    value: function nodeAttached(node) {
      this.uuidMap.set(node.uuid, node);
    }
  }, {
    key: 'nodeDetaching',
    value: function nodeDetaching(node) {
      this.uuidMap.delete(node.uuid);
    }
  }, {
    key: 'probeStarted',
    value: function probeStarted(node) {
      this.probeTotal++;
      this.probeNow++;
      console.log('node ' + node.uuid + ' ' + node.name + ' probe started');
    }
  }, {
    key: 'probeStopped',
    value: function probeStopped(node) {
      this.probeNow--;
      console.log('node ' + node.uuid + ' ' + node.name + ' probe stopped');
    }
  }, {
    key: 'hashStarted',
    value: function hashStarted(node) {
      console.log('node ' + node.uuid + ' ' + node.name + ' hash started');
    }
  }, {
    key: 'hashStopped',
    value: function hashStopped(node) {
      console.log('node ' + node.uuid + ' ' + node.name + ' hash stopped');
    }
  }, {
    key: 'identifyStarted',
    value: function identifyStarted(node) {
      console.log('node ' + node.uuid + ' ' + node.name + ' identify started');
    }
  }, {
    key: 'identifyStopped',
    value: function identifyStopped(node) {
      console.log('node ' + node.uuid + ' ' + node.name + ' identify stopped');
    }

    // create node does NOT probe parent automatically,
    // the probe should be put in caller's try / finally block 

  }, {
    key: 'createNode',
    value: function createNode(parent, xstat) {

      var node = void 0;

      switch (xstat.type) {
        case 'directory':
          node = new _directoryNode2.default(this, xstat);
          break;
        case 'file':
          node = new _fileNode2.default(this, xstat);
          break;
        default:
          throw 'bad xstat'; //TODO
      }

      // this.uuidMap.set(uuid, node)
      node.attach(parent);
      return node.uuid;
    }

    // update means props changed

  }, {
    key: 'updateNode',
    value: function updateNode(node, xstat) {
      node.update(xstat);
    }
  }, {
    key: 'deleteNode',
    value: function deleteNode(node) {
      node.postVisit(function (n) {
        n.detach();
        // this.uuid...
      });
    }
  }, {
    key: 'deleteNodeByUUID',
    value: function deleteNodeByUUID(uuid) {}
  }, {
    key: 'findNodeByUUID',
    value: function findNodeByUUID(uuid) {
      return this.uuidMap.get(uuid);
    }

    // this function is permissive

  }, {
    key: 'requestProbeByUUID',
    value: function requestProbeByUUID(uuid) {

      var node = this.findNodeByUUID(uuid);
      if (!node) return;
      if (!node.isDirectory()) return; // TODO maybe we should throw
      node.probe();
    }
  }, {
    key: 'userPermittedToRead',
    value: function userPermittedToRead(userUUID, node) {

      var drive = node.getDrive();
      switch (drive.type) {
        case 'private':
          return userUUID === drive.owner;
        case 'public':
          return drive.writelist.includes(userUUID) || drive.readlist.includes(userUUID);
        default:
          throw new Error('invalid drive type', drive);
      }
    }
  }, {
    key: 'userPermittedToReadByUUID',
    value: function userPermittedToReadByUUID(userUUID, nodeUUID) {

      var node = this.findNodeByUUID(nodeUUID);
      if (!node) throw new _error2.default.ENODENOTFOUND();
      return this.userPermittedToRead(userUUID, node);
    }
  }, {
    key: 'userPermittedToWrite',
    value: function userPermittedToWrite(userUUID, node) {

      var drive = node.getDrive();
      switch (drive.type) {
        case 'private':
          return userUUID === drive.owner;
        case 'public':
          return drive.writelist.includes(userUUID);
        default:
          throw new Error('invalid drive type', drive);
      }
    }
  }, {
    key: 'userPermittedToWriteByUUID',
    value: function userPermittedToWriteByUUID(userUUID, nodeUUID) {

      var node = this.findNodeByUUID(nodeUUID);
      if (!node) throw new _error2.default.ENODENOTFOUND();
      return this.userPermittedToWrite(userUUID, node);
    }
  }, {
    key: 'userPermittedToShare',
    value: function userPermittedToShare(userUUID, node) {

      var drive = node.getDrive();
      switch (drive.type) {
        case 'private':
          return userUUID === drive.owner;
        case 'public':
          return drive.shareAllowed;
        default:
          throw new Error('invalid drive type', drive);
      }
    }
  }, {
    key: 'userPermittedToShareByUUID',
    value: function userPermittedToShareByUUID(userUUID, nodeUUID) {

      var node = this.findNodeByUUID(nodeUUID);
      if (!node) throw new _error2.default.ENODENOTFOUND();
      return this.userPermittedToShare(userUUID, node);
    }
  }, {
    key: 'fromUserHome',
    value: function fromUserHome(userUUID, node) {
      var drive = node.getDrive();
      return drive.owner === userUUID && drive.ref === 'home';
    }
  }, {
    key: 'fromUserLibrary',
    value: function fromUserLibrary(userUUID, node) {
      var drive = node.getDrive();
      return drive.owner === userUUID && drive.ref === 'library';
    }
  }, {
    key: 'fromUserService',
    value: function fromUserService(userUUID, node) {
      var drive = node.getDrive();
      return drive.owner === userUUID && drive.ref === 'service';
    }
  }, {
    key: 'print',
    value: function print() {
      /**
      let q = {}
      this.root.preVisit(node => q.push({name: node.name}))
      return q
      **/
      return this.root.genObject();
    }
  }]);
  return FileData;
}(_events2.default);

exports.default = FileData;