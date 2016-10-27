'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _serveFavicon = require('serve-favicon');

var _serveFavicon2 = _interopRequireDefault(_serveFavicon);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _auth = require('./middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _init = require('./routes/init');

var _init2 = _interopRequireDefault(_init);

var _users = require('./routes/users');

var _users2 = _interopRequireDefault(_users);

var _login = require('./routes/login');

var _login2 = _interopRequireDefault(_login);

var _files = require('./routes/files');

var _files2 = _interopRequireDefault(_files);

var _meta = require('./routes/meta');

var _meta2 = _interopRequireDefault(_meta);

var _share = require('./routes/share');

var _share2 = _interopRequireDefault(_share);

var _drives = require('./routes/drives');

var _drives2 = _interopRequireDefault(_drives);

var _libraries = require('./routes/libraries');

var _libraries2 = _interopRequireDefault(_libraries);

var _media = require('./routes/media');

var _media2 = _interopRequireDefault(_media);

var _mediashare = require('./routes/mediashare');

var _mediashare2 = _interopRequireDefault(_mediashare);

var _samba = require('./routes/samba');

var _samba2 = _interopRequireDefault(_samba);

var _winsun = require('./routes/winsun');

var _winsun2 = _interopRequireDefault(_winsun);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

var env = app.get('env');
if (env !== 'production' && env !== 'development' && env !== 'test') {
  console.log('[fruitmix] Unrecognized NODE_ENV string: ' + env + ', exit');
  process.exit(1);
} else {
  console.log('[fruitmix] NODE_ENV is set to ' + env);
}

app.use((0, _morgan2.default)('dev', {
  skip: function skip(req, res) {
    return res.nolog === true;
  }
}));

app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: false }));
app.use(_auth2.default.init());

app.use(_express2.default.static(_path2.default.join(__dirname, 'public')));
app.use('/init', _init2.default);
app.use('/login', _login2.default);

app.use('/token', require('./routes/token'));

app.use('/users', _users2.default);

app.use('/libraries', _libraries2.default);
app.use('/drives', _drives2.default);
app.use('/files', _files2.default);
app.use('/meta', _meta2.default);
app.use('/share', _share2.default);
app.use('/media', _media2.default);
app.use('/mediashare', _mediashare2.default);

app.use('/authtest', require('./routes/authtest'));
app.use('/samba', _samba2.default);
app.use('/winsun', _winsun2.default);

// app.use('/library', require('./routes/library'))
// app.use('/mediashare', require('./routes/mediashare'))

// app.use(multer({ dest:'/data/fruitmix/files' }).any())

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.type('text/plain');
  res.send(err.status + ' ' + err.message);
});

module.exports = app;