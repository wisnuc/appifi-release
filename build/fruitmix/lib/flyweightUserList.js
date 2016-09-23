'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _freeze = require('babel-runtime/core-js/object/freeze');

var _freeze2 = _interopRequireDefault(_freeze);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FlyWeightList = function () {
  function FlyWeightList() {
    (0, _classCallCheck3.default)(this, FlyWeightList);


    this.array = [];
    this.array.push('*');
    this.array.push([]);

    this.map = new _map2.default();
  }

  // allowed input: *, [], or [uuid...]


  (0, _createClass3.default)(FlyWeightList, [{
    key: 'getIndex',
    value: function getIndex(userlist) {

      if (userlist === '*') return 0;
      if (Array.isArray(userlist) && !userlist.length) return 1;

      var dedup = [].concat((0, _toConsumableArray3.default)(userlist)).sort().filter(function (item, index, array) {
        return !index || item !== array[index - 1];
      });

      var join = dedup.join();

      var index = this.map.get(join);
      if (index !== undefined) return index;

      index = this.array.length;

      // dedup is freezed
      // user who retrieves it later cannot modify it
      (0, _freeze2.default)(dedup);

      this.array.push(dedup);
      this.map.set(join, index);
      return index;
    }

    // return undefined if index out-of-range

  }, {
    key: 'getList',
    value: function getList(index) {
      if (index >= this.array.length) return;
      return this.array[index];
    }
  }]);
  return FlyWeightList;
}();

exports.default = FlyWeightList;