'use strict';

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var router = require('express').Router();

router.get('/', function (req, res) {

  _config2.default.ipc.call('ipctest', 'hello', function (err, data) {

    if (err) return res.status(500).json({
      err: {
        code: err.code,
        message: err.message
      }
    });

    res.status(200).json({ data: data });
  });
});

module.exports = router;