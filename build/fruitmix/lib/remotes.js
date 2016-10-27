"use strict";

var _map = require("babel-runtime/core-js/map");

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require("babel-runtime/helpers/classCallCheck");

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require("babel-runtime/helpers/createClass");

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// a remote represents a remote user
//
// the key design criteria is: like the git, conceptually there is
// a local branch mirroring a remote one. This local branch is read-only,
// can only be updated atomically from the remote server.
// this is a simple model to avoid all the issues raised from inconsistent status
// between two parties. 
var Remote = function () {
  function Remote(myUUID) {
    (0, _classCallCheck3.default)(this, Remote);


    this.myUUID = myUUID;

    this.friendUUIDs = friendUUIDs;

    this.shareMap = new _map2.default();
    this.mediaMap = new _map2.default();
    this.talkMap = new _map2.default();
  }

  // an update should replace everything!


  (0, _createClass3.default)(Remote, [{
    key: "update",
    value: function update() {}
  }, {
    key: "getShares",
    value: function getShares(friendUUID) {}
  }, {
    key: "getTalks",
    value: function getTalks(mediaUUID, friendUUID) {}
  }]);
  return Remote;
}();