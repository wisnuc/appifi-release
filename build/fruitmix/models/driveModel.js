'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDriveModelAsync = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _collection = require('./collection');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** 

Schema

{
  label: a string

  fixedOwner: true: only one owner, cannot be changed; false: shared drive

  URI: 'fruitmix', 'appifi', 'peripheral:uuid=', 'peripheral:label=', 
      noticing that the uuid or label are file system uuid or label, not partition uuid or label, 
      the former are stored inside file system, if you reformat the file system, they are changed.
      the latter are GUID partition table uuid, they persists after reformatting the partition. 
      they are only changed when the partition table updated.

  uuid: drive uuid
  owner: []
  writelist: []
  readlist: []

  cache: true or false
}

for usb drive 

  label => folder name
  fixedOwner: false
  URI: 'partition uuid + fs uuid'
  uuid: generate
  owner: [*]
  writelist: [*]
  readlist: [*]

**/

var DriveModel = function () {
  function DriveModel(collection) {
    (0, _classCallCheck3.default)(this, DriveModel);

    this.collection = collection;
    this.hash = _nodeUuid2.default.v4();
  }

  // this function requires the uuid to be passed in
  // because the folder should be created before update model database


  (0, _createClass3.default)(DriveModel, [{
    key: 'createDrive',
    value: function createDrive(_ref, callback) {
      var label = _ref.label,
          fixedOwner = _ref.fixedOwner,
          URI = _ref.URI,
          uuid = _ref.uuid,
          owner = _ref.owner,
          writelist = _ref.writelist,
          readlist = _ref.readlist,
          cache = _ref.cache;


      var conf = { label: label, fixedOwner: fixedOwner, URI: URI, uuid: uuid, owner: owner, writelist: writelist, readlist: readlist, cache: cache };

      var list = this.collection.list;

      // this function returns err or undefined
      this.collection.updateAsync(list, [].concat((0, _toConsumableArray3.default)(list), [conf])).asCallback(callback);
      // FIXME
      this.hash = _nodeUuid2.default.v4();
    }
  }]);
  return DriveModel;
}();

var createDriveModelAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(filepath, tmpfolder) {
    var collection;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _collection.openOrCreateCollectionAsync)(filepath, tmpfolder);

          case 2:
            collection = _context.sent;

            if (!collection) {
              _context.next = 5;
              break;
            }

            return _context.abrupt('return', new DriveModel(collection));

          case 5:
            return _context.abrupt('return', null);

          case 6:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function createDriveModelAsync(_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

exports.createDriveModelAsync = createDriveModelAsync;