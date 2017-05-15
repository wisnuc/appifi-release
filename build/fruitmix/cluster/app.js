'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _auth = require('./middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

var _login = require('./routes/login');

var _login2 = _interopRequireDefault(_login);

var _ipctest = require('./routes/ipctest');

var _ipctest2 = _interopRequireDefault(_ipctest);

var _response = require('./middleware/response');

var _response2 = _interopRequireDefault(_response);

var _index = require('./routes/index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
import init from './routes/init'
import token from './routes/token'
import users from './routes/users'
import drives from './routes/drives'

import files from './routes/files'
// import share from './routes/share'
import libraries from './routes/libraries'
import media from './routes/media'
import mediashare from './routes/mediashare'
import authtest from '../routes/authtest'
**/

var App = function App() {

  var app = (0, _express2.default)();

  /**
    let env = app.get('env')
    if (env !== 'production' && env !== 'development' && env !== 'test') {
      console.log('[fruitmix] Unrecognized NODE_ENV string: ' + env +', exit')
      process.exit(1)
    } else {
      console.log('[fruitmix] NODE_ENV is set to ' + env)
    }
  **/

  app.use((0, _morgan2.default)('dev', { skip: function skip(req, res) {
      return res.nolog === true;
    } }));

  app.use(_bodyParser2.default.json());
  app.use(_bodyParser2.default.urlencoded({ extended: false }));
  app.use(_auth2.default.init());

  app.get('/', function (req, res) {
    setTimeout(function () {
      console.log('pid: ' + process.pid);
      res.send('hello world');
    }, 1000);
  });

  // add res.error(), res.success()
  app.use(_response2.default);

  // app.use(express.static(path.join(__dirname, 'public')))
  app.use('/', _index2.default);

  // app.use('/login', login)
  // app.use('/ipctest', ipctest)
  /**
    app.use('/init', init)
    app.use('/token', token)
    app.use('/users', users)
    app.use('/drives', drives)
    app.use('/files', files)
    app.use('/libraries', libraries)
    // app.use('/share', share)
    app.use('/media', media)
    app.use('/mediashare', mediashare)
    app.use('/authtest', authtest)
  **/
  return app;
};

exports.default = App;