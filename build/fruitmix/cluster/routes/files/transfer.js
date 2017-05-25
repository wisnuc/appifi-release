'use strict';

var _bluebird = require('bluebird');

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var fs = (0, _bluebird.promisifyAll)(require('fs'));

var router = require('express').Router();
var validator = require('validator');

var isUUID = function isUUID(uuid) {
  return typeof uuid === 'string' ? validator.isUUID(uuid) : false;
};

router.get('/hello', function (req, res) {
  res.status(200).end();
});

router.get('/', function (req, res) {
  _config2.default.ipc.call('getWorkers', req.user.uuid, function (e, workers) {
    if (e) return res.error(e, 500);
    return res.success(workers, 200);
  });
});

/**
 * src / dst:{
 *  type: 'fruitmix' or 'ext'
 *  path:  if type = 'fruitmix', UUID / else relpath
 *  rootPath: if type = 'fruitmix' ,it undefine, else UUID
 * }
 * 
 */

router.post('/:type', function (req, res) {
  var type = req.params.type === 'move' ? 'createMove' : req.params.type === 'copy' ? 'createCopy' : undefined;
  if (type) {
    var src = req.body.src;
    var dst = req.body.dst;
    if (typeof src.path !== 'string' || typeof dst.path !== 'string') return res.error(new Error('path type error'), 400);
    if (!(src.type === 'fruitmix' && isUUID(src.path) || src.type === 'ext' && path.isAbsolute(src.path))) return res.error(new Error('src error'), 400);
    if (!(dst.type === 'fruitmix' && isUUID(dst.path) || dst.type === 'ext' && path.isAbsolute(dst.path))) return res.error(new Error('dst error'), 400);

    _config2.default.ipc.call(type, { src: src, dst: dst, userUUID: req.user.uuid }, function (e, data) {
      if (e) {
        console.log(e);
        return res.error(e, 500);
      }
      return res.success(data, 200);
    });
  } else {
    res.error(null, 404);
  }
});

router.post('/abort/:taskid', function (req, res) {
  var args = { userUUID: req.user.uuid, workerId: req.params.taskid };
  _config2.default.ipc.call('abortWorker', args, function (err, data) {
    if (err) return res.error(err, 500);
    return res.success(null, 200);
  });
});

module.exports = router;