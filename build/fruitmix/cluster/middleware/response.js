'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by jianjin.wu on 2017/3/22.
 *
 */

var DEFAULT_SUCCESS_STATUS = 200;
var DEFAULT_ERROR_STATUS = 500;

//http code
var httpCode = {
  400: 'EINVAL', // invalid parameters
  404: 'ENOTFOUND', // not found
  500: 'ESYSERR' // system error
};

// define('EINVAL', 'invalid parameters')
// define('EACCESS', 'access denied')
// define('EFORMAT', 'bad format')
// define('EABORT', 'aborted')
// define('ENOTDIR', 'not a directory')
// define('ENOTFILE', 'not a regular file')
// define('ENOTDIRFILE', 'not a directory or a regular file')
// define('EINSTANCE', 'instance changed')
// define('ECONTENT', 'content changed (digest mismatch)')
// define('ETIMESTAMP', 'timestamp changed during operation')
// define('EEXITCODE', 'exit with error code')
// define('EEXITSIGNAL', 'exit with signal')
// define('ENOENT', 'no entry')
// define('ELOCK', 'lock error')

// define('ENODENOTFOUND', 'node not found')     // be different from ENOENT, which is easily confused with fs error, TODO not sure if this is the right design
// define('ENODEDETACHED', 'node is detached')

exports.default = function (req, res, next) {

  /**
   * add res.success()
   * @param data
   * @param status no required
   */
  res.success = function (data, status) {
    data = data || null;
    status = status || DEFAULT_SUCCESS_STATUS;
    return res.status(status).json(data);
  };

  /**
   * add res.error()
   * @param err {Error} or {String}
   * @param status no required
   */
  //FIXME: err {code:' ',message: ''}
  res.error = function (err, status) {

    var code = void 0,
        message = void 0,
        stack = void 0;
    if (err) {
      if (err instanceof Error) {
        status = status || err.status;
        code = err.code;
        message = err.message;
        stack = err.stack;
      } else if (typeof err === 'string') {
        message = err;
      } else if ((typeof err === 'undefined' ? 'undefined' : (0, _typeof3.default)(err)) === 'object') {
        code = err.code;
        message = err.message;
      }
    }

    status = status || DEFAULT_ERROR_STATUS;
    code = code || httpCode[status];

    return res.status(status).json({
      code: code || 'no httpCode',
      message: message || 'system error',
      stack: stack
    });
  };

  next();
};