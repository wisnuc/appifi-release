'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.openOrCreateCollectionAsync = undefined;

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _throw = require('../util/throw');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_fs2.default);

var Collection = function () {
  function Collection(filepath, tmpfolder, list) {
    (0, _classCallCheck3.default)(this, Collection);

    this.filepath = filepath;
    this.tmpfolder = tmpfolder;
    this.list = list; // this is treated as immutable
    this.locked = false;
  }

  /**
    throw EBUSY if locked
    throw EOUTOFSYNC if list is outdated
     since list is treated as immutable, newlist should be different from list
  **/


  (0, _createClass3.default)(Collection, [{
    key: 'updateAsync',
    value: function () {
      var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(list, newlist) {
        var tmpSubFolder, tmpfile, json;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:

                if (this.locked) (0, _throw.throwBusy)();
                if (list !== this.list) (0, _throw.throwOutOfSync)();
                this.locked = true;

                _context.prev = 3;
                _context.next = 6;
                return _fs2.default.mkdtempAsync(this.tmpfolder);

              case 6:
                tmpSubFolder = _context.sent;
                tmpfile = tmpSubFolder + '/tmpfile';
                json = (0, _stringify2.default)(newlist, null, '  ');
                _context.next = 11;
                return _fs2.default.writeFileAsync(tmpfile, json);

              case 11:
                _context.next = 13;
                return _fs2.default.renameAsync(tmpfile, this.filepath);

              case 13:
                _fs2.default.rmdir(tmpSubFolder, function () {}); // it doesn't matter if this fails 
                this.locked = false;
                this.list = newlist;
                _context.next = 22;
                break;

              case 18:
                _context.prev = 18;
                _context.t0 = _context['catch'](3);

                this.locked = false;
                throw _context.t0;

              case 22:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 18]]);
      }));

      function updateAsync(_x, _x2) {
        return _ref.apply(this, arguments);
      }

      return updateAsync;
    }()
  }]);
  return Collection;
}();

var openOrCreateCollectionAsync = function () {
  var _ref2 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(filepath, tmpfolder) {
    var data, list;
    return _regenerator2.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return _fs2.default.readFileAsync(filepath);

          case 3:
            data = _context2.sent;
            list = JSON.parse(data.toString());

            if (!Array.isArray(list)) (0, _throw.throwError)('not an array');
            return _context2.abrupt('return', new Collection(filepath, tmpfolder, list));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);

            if (!(_context2.t0.code !== 'ENOENT')) {
              _context2.next = 13;
              break;
            }

            throw _context2.t0;

          case 13:
            return _context2.abrupt('return', new Collection(filepath, tmpfolder, []));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, undefined, [[0, 9]]);
  }));

  return function openOrCreateCollectionAsync(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

exports.openOrCreateCollectionAsync = openOrCreateCollectionAsync;


var impromptu = function () {
  var _ref3 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3() {
    var list, l1, l2;
    return _regenerator2.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return _bluebird2.default.promisify(_mkdirp2.default)('tmptest');

          case 2:
            _context3.next = 4;
            return openOrCreateCollectionAsync('tmptest/userlist.json', 'tmptest');

          case 4:
            list = _context3.sent;
            l1 = list.list;
            l2 = [].concat((0, _toConsumableArray3.default)(l1), [{ joe: 'jane' }]);
            _context3.next = 9;
            return list.updateAsync(l1, l2);

          case 9:
            return _context3.abrupt('return', l2);

          case 10:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, undefined);
  }));

  return function impromptu() {
    return _ref3.apply(this, arguments);
  };
}();

// impromptu().then(l => console.log(l)).catch(e => console.log(e))