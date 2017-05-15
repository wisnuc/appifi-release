'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _express = require('express');

var _init = require('./init');

var _init2 = _interopRequireDefault(_init);

var _login = require('./login');

var _login2 = _interopRequireDefault(_login);

var _token = require('./token');

var _token2 = _interopRequireDefault(_token);

var _files = require('./files');

var _files2 = _interopRequireDefault(_files);

var _filemap = require('./filemap');

var _filemap2 = _interopRequireDefault(_filemap);

var _fileshare = require('./fileshare');

var _fileshare2 = _interopRequireDefault(_fileshare);

var _mediashare = require('./mediashare');

var _mediashare2 = _interopRequireDefault(_mediashare);

var _libraries = require('./libraries');

var _libraries2 = _interopRequireDefault(_libraries);

var _admin = require('./admin');

var _admin2 = _interopRequireDefault(_admin);

var _account = require('./account');

var _account2 = _interopRequireDefault(_account);

var _drives = require('./drives');

var _drives2 = _interopRequireDefault(_drives);

var _users = require('./users');

var _users2 = _interopRequireDefault(_users);

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var media = require('./media'); /**
                                 * Created by jianjin.wu on 2017/3/22.
                                 * the entrance of routes
                                 */

var ipctest = require('./ipctest');


var router = (0, _express.Router)();

router.use('/init', _init2.default);
router.use('/login', _login2.default);
router.use('/token', _token2.default);
router.use('/files', _auth2.default.jwt(), _files2.default);
router.use('/filemap', _auth2.default.jwt(), _filemap2.default);
router.use('/libraries', _auth2.default.jwt(), _libraries2.default);
router.use('/ipctest', _auth2.default.jwt(), ipctest);
router.use('/fileshare', _auth2.default.jwt(), _fileshare2.default);
router.use('/mediashare', _auth2.default.jwt(), _mediashare2.default);
router.use('/media', _auth2.default.jwt(), media);
router.use('/account', _auth2.default.jwt(), _account2.default);
router.use('/users', _auth2.default.jwt(), _users2.default);
router.use('/drives', _auth2.default.jwt(), _drives2.default);
router.use('/admin', _auth2.default.jwt(), _admin2.default);

exports.default = router;