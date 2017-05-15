'use strict';

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = require('fs');

var localUsers = function localUsers(callback) {
  var mpath = path.join(_config2.default.path, 'models', 'model.json');
  fs.readFile(mpath, function (err, data) {
    if (err) return callback(err);
    var model = void 0;
    try {
      model = JSON.parse(data);
    } catch (e) {
      return callback(e);
    }

    var users = model.users;
    callback(null, users.filter(function (u) {
      return u.type === 'local';
    }));
  });
};

module.exports = {
  localUsers: localUsers
};