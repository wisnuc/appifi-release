'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _bluebird = require('bluebird');

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _xstat = require('./xstat');

var _directoryNode = require('./directoryNode');

var _directoryNode2 = _interopRequireDefault(_directoryNode);

var _fileNode = require('./fileNode');

var _fileNode2 = _interopRequireDefault(_fileNode);

var _error3 = require('../lib/error');

var _error4 = _interopRequireDefault(_error3);

var _async = require('../util/async');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var path = require('path');
var rimraf = require('rimraf');
var fs = (0, _bluebird.promisifyAll)(require('fs'));

var FileService = function () {
  function FileService(froot, data, shareData) {
    (0, _classCallCheck3.default)(this, FileService);

    this.froot = froot;
    this.data = data;
    this.shareData = shareData;
  }

  (0, _createClass3.default)(FileService, [{
    key: 'nodeProps',
    value: function nodeProps(node) {
      if (node instanceof _directoryNode2.default) {
        return {
          uuid: node.uuid,
          type: 'folder',
          name: node.name,
          mtime: node.mtime
        };
      } else if (node instanceof _fileNode2.default) {
        return {
          uuid: node.uuid,
          type: 'file',
          name: node.name,
          size: node.size,
          mtime: node.mtime // FIXME: need change mtime definition      
        };
      }
    }
  }, {
    key: 'userReadable',
    value: function userReadable(userUUID, node) {

      return this.data.userPermittedToRead(userUUID, node) || this.shareData.userAuthorizedToRead(userUUID, node);
    }
  }, {
    key: 'userWritable',
    value: function userWritable(userUUID, node) {
      return this.data.userPermittedToWrite(userUUID, node) || this.shareData.userAuthorizedToWrite(userUUID, node);
    }

    // list all items inside a directory

  }, {
    key: 'list',
    value: function () {
      var _ref = (0, _bluebird.method)(function (_ref2) {
        var _this = this;

        var userUUID = _ref2.userUUID,
            dirUUID = _ref2.dirUUID;


        var shareCollection = this.shareData.findShareCollectionByUUID(dirUUID);
        if (shareCollection) {
          return shareCollection.map(function (n) {
            return _this.nodeProps(n);
          });
        } else {
          var node = this.data.findNodeByUUID(dirUUID);
          if (!node) throw new _error4.default.ENODENOTFOUND();
          if (!node.isDirectory()) throw new _error4.default.ENOTDIR();
          if (!this.userReadable(userUUID, node)) throw new _error4.default.EACCESS();

          return node.getChildren().map(function (n) {
            return _this.nodeProps(n);
          });
        }
      });

      function list(_x) {
        return _ref.apply(this, arguments);
      }

      return list;
    }()

    // list all items inside a directory, with given
    // dirUUID must be a virtual drive uuid 
    // rootUUID can be a fileshare uuid or virtual drive uuid.

  }, {
    key: 'navList',
    value: function () {
      var _ref3 = (0, _bluebird.method)(function (_ref4) {
        var _this2 = this;

        var userUUID = _ref4.userUUID,
            dirUUID = _ref4.dirUUID,
            rootUUID = _ref4.rootUUID;


        var node = this.data.findNodeByUUID(dirUUID);
        if (!node) throw new _error4.default.ENODENOTFOUND();
        if (!node.isDirectory()) throw new _error4.default.ENOTDIR();
        if (!this.userReadable(userUUID, node)) throw new _error4.default.EACCESS();

        var share = this.shareData.findShareByUUID(rootUUID);
        if (share) {

          var _path = this.shareData.findSharePath(rootUUID, dirUUID);
          return {
            path: _path,
            entries: node.getChildren().map(function (n) {
              return _this2.nodeProps(n);
            })
          };
        } else {

          var root = this.data.findNodeByUUID(rootUUID);
          if (!root) throw new _error4.default.ENODENOTFOUND();

          var _path2 = node.nodepath();
          var index = _path2.indexOf(root);

          if (index === -1) throw new _error4.default.ENOENT();
          var subpath = _path2.slice(index);

          return {
            path: subpath.map(function (n) {
              return _this2.nodeProps(n);
            }),
            entries: node.getChildren().map(function (n) {
              return _this2.nodeProps(n);
            })
          };
        }
      });

      function navList(_x2) {
        return _ref3.apply(this, arguments);
      }

      return navList;
    }()

    // list all descendant inside a directory

  }, {
    key: 'tree',
    value: function () {
      var _ref5 = (0, _bluebird.method)(function (_ref6) {
        var _this3 = this;

        var userUUID = _ref6.userUUID,
            dirUUID = _ref6.dirUUID;


        var queue = [];
        var shareCollection = this.shareData.findShareCollectionByUUID(dirUUID);
        if (shareCollection) {
          shareCollection.map(function (n) {
            var tempArr = [];
            n.preVisit(function (n) {
              tempArr.push(_this3.nodeProps(n));
            });
            queue.push(tempArr);
          });
        } else {
          var node = this.data.findNodeByUUID(dirUUID);
          if (!node) throw new _error4.default.ENODENOTFOUND();
          if (!node.isDirectory()) throw new _error4.default.ENOTDIR();
          if (!this.userReadable(userUUID, node)) throw new _error4.default.EACCESS();

          node.getChildren().map(function (n) {
            var tempArr = [];
            n.preVisit(function (n) {
              tempArr.push(_this3.nodeProps(n));
            });
            queue.push(tempArr);
          });
        }
        return queue;
      });

      function tree(_x3) {
        return _ref5.apply(this, arguments);
      }

      return tree;
    }()

    // list all descendant inside a directory, with given
    // dirUUID must be a virtual drive uuid
    // rootUUID must be a fileshare uuid or virtual drive uuid.

  }, {
    key: 'navTree',
    value: function () {
      var _ref7 = (0, _bluebird.method)(function (_ref8) {
        var _this4 = this;

        var userUUID = _ref8.userUUID,
            dirUUID = _ref8.dirUUID,
            rootUUID = _ref8.rootUUID;


        var queue = [];
        var newPath = void 0;
        var node = this.data.findNodeByUUID(dirUUID);
        if (!node) throw new _error4.default.ENODENOTFOUND();
        if (!node.isDirectory()) throw new _error4.default.ENOTDIR();
        if (!this.userReadable(userUUID, node)) throw new _error4.default.EACCESS();

        var share = this.shareData.findShareByUUID(rootUUID);
        //get the path
        if (share) {
          newPath = this.shareData.findSharePath(rootUUID, dirUUID);
        } else {
          var root = this.data.findNodeByUUID(rootUUID);
          if (!root) throw new _error4.default.ENODENOTFOUND();

          var _path3 = node.nodepath();
          var index = _path3.indexOf(root);

          if (index === -1) throw new _error4.default.ENOENT();
          var subpath = _path3.slice(index);
          newPath = subpath.map(function (n) {
            return _this4.nodeProps(n);
          });
        }

        node.getChildren().map(function (n) {
          var tempArr = [];
          n.preVisit(function (n) {
            tempArr.push(_this4.nodeProps(n));
          });
          queue.push(tempArr);
        });
        return {
          path: newPath,
          entries: queue
        };
      });

      function navTree(_x4) {
        return _ref7.apply(this, arguments);
      }

      return navTree;
    }()

    // return abspath of file

  }, {
    key: 'readFile',
    value: function () {
      var _ref9 = (0, _bluebird.method)(function (_ref10) {
        var userUUID = _ref10.userUUID,
            dirUUID = _ref10.dirUUID,
            fileUUID = _ref10.fileUUID;


        var dirNode = this.data.findNodeByUUID(dirUUID);
        var fileNode = this.data.findNodeByUUID(fileUUID);

        if (!dirNode || !fileNode) throw new _error4.default.ENODENOTFOUND();
        if (!dirNode.isDirectory()) throw new _error4.default.ENOTDIR();
        if (!fileNode.isFile()) throw new _error4.default.ENOENT();
        if (!this.userReadable(userUUID, dirNode)) throw new _error4.default.EACCESS();

        return fileNode.abspath();
      });

      function readFile(_x5) {
        return _ref9.apply(this, arguments);
      }

      return readFile;
    }()

    // dump a whole drive

  }, {
    key: 'dumpDrive',
    value: function dumpDrive(userUUID, driveUUID) {}

    // create new directory inside given dirUUID
    // dirUUID cannot be a fileshare UUID

  }, {
    key: 'createDirectory',
    value: function () {
      var _ref11 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(_ref12) {
        var userUUID = _ref12.userUUID,
            dirUUID = _ref12.dirUUID,
            dirname = _ref12.dirname;
        var node, targetpath, xstat;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                node = this.data.findNodeByUUID(dirUUID);

                if (node) {
                  _context.next = 3;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 3:
                if (node.isDirectory()) {
                  _context.next = 5;
                  break;
                }

                throw new _error4.default.ENOTDIR();

              case 5:
                if (this.userWritable(userUUID, node)) {
                  _context.next = 7;
                  break;
                }

                throw new _error4.default.EACCESS();

              case 7:
                if (!node.getChildren().find(function (child) {
                  return child.name === dirname;
                })) {
                  _context.next = 9;
                  break;
                }

                throw new _error4.default.EEXIST();

              case 9:
                _context.prev = 9;

                //create new createDirectory
                targetpath = path.join(node.abspath(), dirname);
                _context.next = 13;
                return (0, _bluebird.resolve)(fs.mkdirAsync(targetpath));

              case 13:
                _context.next = 15;
                return (0, _bluebird.resolve)((0, _xstat.readXstatAsync)(targetpath));

              case 15:
                xstat = _context.sent;
                return _context.abrupt('return', this.data.createNode(node, xstat));

              case 19:
                _context.prev = 19;
                _context.t0 = _context['catch'](9);
                throw _context.t0;

              case 22:
                _context.prev = 22;

                if (node.parent) this.data.requestProbeByUUID(node.parent);
                return _context.finish(22);

              case 25:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[9, 19, 22, 25]]);
      }));

      function createDirectory(_x6) {
        return _ref11.apply(this, arguments);
      }

      return createDirectory;
    }()

    // create new file inside given dirUUID, 

  }, {
    key: 'createFile',
    value: function createFile(args, callback) {
      var _this5 = this;

      var userUUID = args.userUUID,
          srcpath = args.srcpath,
          dirUUID = args.dirUUID,
          name = args.name,
          sha256 = args.sha256;

      var targetNode = this.data.findNodeByUUID(dirUUID);

      if (!targetNode.isDirectory()) {
        var error = new Error('createFile: target must be a folder');
        error.code = 'EINVAL';
        return process.nextTick(callback, error);
      }

      // user permission check
      if (!targetNode.userWritable(userUUID)) {
        var _error = new Error('createFile: operation not permitted');
        _error.code = 'EACCESS';
        return process.nextTick(callback, _error);
      }

      if (this.list(userUUID, dirUUID).find(function (child) {
        return child.name == name;
      })) {
        var _error2 = new Error('createFile: file or folder already exists');
        _error2.code = 'EEXIST';
        return process.nextTick(callback, _error2);
      }

      var targetpath = path.join(targetNode.namepath(), name);

      //rename file 
      fs.rename(srcpath, targetpath, function (err) {
        if (err) return callback(err);
        (0, _xstat.readXstat)(targetpath, function (err, xstat) {
          //create new node
          var node = _this5.data.createNode(targetNode, xstat);
          callback(null, node);
        });
      });
    }

    /**
    // create new file before check
    createFileCheck(args, callback){
      let { userUUID, dirUUID, name } = args
      let node = this.data.findNodeByUUID(dirUUID)
      if(!node || userCanRead(userUUID, node))
        return callback(new Error('Permission denied'))
      if(node.isDirectory() && this.list(userUUID, dirUUID).find(child => child.name == name && child.type === 'file'))
        return callback(new Error('File exist')) // TODO
      callback(null, node)
    }
    **/

    // check must be provided as boolean
    // early return null if check is true
    // name must be valid filename, this can be asserted with sanitize-filename TODO
    // src must be absolute path
    // hash is optional, if it is provided, it is trusted

  }, {
    key: 'createFileAsync',
    value: function () {
      var _ref13 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee2(args) {
        var userUUID, dirUUID, name, src, hash, check, node, dst, xstat;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                userUUID = args.userUUID, dirUUID = args.dirUUID, name = args.name, src = args.src, hash = args.hash, check = args.check;

                // if check is true
                // userUUID, dirUUID, name, mandatory  
                // if check is false
                // userUUID, dirUUID, name, src, mandatory; hash optional

                node = this.data.findNodeByUUID(dirUUID);

                if (node) {
                  _context2.next = 4;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 4:
                if (node.isDirectory()) {
                  _context2.next = 6;
                  break;
                }

                throw new _error4.default.ENOTDIR();

              case 6:
                if (this.userWritable(userUUID, node)) {
                  _context2.next = 8;
                  break;
                }

                throw new _error4.default.EACCESS();

              case 8:
                if (!node.getChildren().map(function (n) {
                  return n.name;
                }).includes(name)) {
                  _context2.next = 10;
                  break;
                }

                throw new _error4.default.EEXIST();

              case 10:
                if (!(check === true)) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt('return', null);

              case 12:
                dst = path.join(node.abspath(), name);
                _context2.prev = 13;
                _context2.next = 16;
                return (0, _bluebird.resolve)(fs.renameAsync(src, dst));

              case 16:
                _context2.next = 18;
                return (0, _bluebird.resolve)((0, _xstat.readXstatAsync)(dst));

              case 18:
                xstat = _context2.sent;

                if (!hash) {
                  _context2.next = 23;
                  break;
                }

                _context2.next = 22;
                return (0, _bluebird.resolve)((0, _xstat.updateFileHashAsync)(dst, xstat.uuid, hash, xstat.mtime));

              case 22:
                xstat = _context2.sent;

              case 23:
                return _context2.abrupt('return', this.data.createNode(node, xstat));

              case 26:
                _context2.prev = 26;
                _context2.t0 = _context2['catch'](13);
                throw _context2.t0;

              case 29:
                _context2.prev = 29;

                this.data.requestProbeByUUID(dirUUID);
                return _context2.finish(29);

              case 32:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[13, 26, 29, 32]]);
      }));

      function createFileAsync(_x7) {
        return _ref13.apply(this, arguments);
      }

      return createFileAsync;
    }()

    // create file or check in user's library  

  }, {
    key: 'createLibraryFileAsync',
    value: function () {
      var _ref14 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee3(args) {
        var sha256, libraryUUID, src, check, libraryNode, node, dstFolder, dst, xstat;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                sha256 = args.sha256, libraryUUID = args.libraryUUID, src = args.src, check = args.check;
                libraryNode = this.data.findNodeByUUID(libraryUUID);

                if (!(typeof sha256 !== 'string')) {
                  _context3.next = 4;
                  break;
                }

                throw new _error4.default.EINVAL();

              case 4:
                if (libraryNode) {
                  _context3.next = 6;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 6:
                if (libraryNode.isDirectory()) {
                  _context3.next = 8;
                  break;
                }

                throw new _error4.default.ENOTDIR();

              case 8:
                node = libraryNode.getChildren().find(function (l) {
                  return l.name === sha256.slice(0, 2);
                });

                if (!(node && node.isDirectory() && node.getChildren().map(function (l) {
                  return l.name;
                }).includes(sha256.slice(2)))) {
                  _context3.next = 11;
                  break;
                }

                throw new _error4.default.EEXIST();

              case 11:
                if (!(check === true)) {
                  _context3.next = 13;
                  break;
                }

                return _context3.abrupt('return', null);

              case 13:
                dstFolder = path.join(libraryNode.abspath(), sha256.slice(0, 2));
                dst = path.join(dstFolder, sha256.slice(2));
                _context3.prev = 15;
                _context3.next = 18;
                return (0, _bluebird.resolve)((0, _async.mkdirpAsync)(dstFolder));

              case 18:
                _context3.next = 20;
                return (0, _bluebird.resolve)(fs.renameAsync(src, dst));

              case 20:
                _context3.next = 22;
                return (0, _bluebird.resolve)((0, _xstat.readXstatAsync)(dst));

              case 22:
                xstat = _context3.sent;
                _context3.next = 25;
                return (0, _bluebird.resolve)((0, _xstat.updateFileHashAsync)(dst, xstat.uuid, sha256, xstat.mtime));

              case 25:
                xstat = _context3.sent;
                return _context3.abrupt('return', xstat);

              case 29:
                _context3.prev = 29;
                _context3.t0 = _context3['catch'](15);
                throw _context3.t0;

              case 32:
                _context3.prev = 32;

                this.data.requestProbeByUUID(libraryUUID);
                return _context3.finish(32);

              case 35:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[15, 29, 32, 35]]);
      }));

      function createLibraryFileAsync(_x8) {
        return _ref14.apply(this, arguments);
      }

      return createLibraryFileAsync;
    }()

    // overwrite existing file

  }, {
    key: 'overwriteFileAsync',
    value: function () {
      var _ref15 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee4(_ref16) {
        var userUUID = _ref16.userUUID,
            srcpath = _ref16.srcpath,
            fileUUID = _ref16.fileUUID,
            hash = _ref16.hash;
        var node, dst, xstat;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                node = this.data.findNodeByUUID(fileUUID);

                if (node) {
                  _context4.next = 3;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 3:
                if (node.isFile()) {
                  _context4.next = 5;
                  break;
                }

                throw new _error4.default.ENOTDIR();

              case 5:
                if (this.userWritable(userUUID, node)) {
                  _context4.next = 7;
                  break;
                }

                throw new _error4.default.EACCESS();

              case 7:
                // if (node.getChildren().map(n => n.name).includes(name)) throw new E.EEXIST()
                dst = node.abspath();
                _context4.prev = 8;
                _context4.next = 11;
                return (0, _bluebird.resolve)(fs.renameAsync(srcpath, dst));

              case 11:
                _context4.next = 13;
                return (0, _bluebird.resolve)((0, _xstat.readXstatAsync)(dst));

              case 13:
                xstat = _context4.sent;

                if (!hash) {
                  _context4.next = 18;
                  break;
                }

                _context4.next = 17;
                return (0, _bluebird.resolve)((0, _xstat.updateFileHashAsync)(dst, xstat.uuid, hash, xstat.mtime));

              case 17:
                xstat = _context4.sent;

              case 18:
                return _context4.abrupt('return', this.data.createNode(node, xstat));

              case 21:
                _context4.prev = 21;
                _context4.t0 = _context4['catch'](8);
                throw _context4.t0;

              case 24:
                _context4.prev = 24;

                this.data.requestProbeByUUID(fileUUID);
                return _context4.finish(24);

              case 27:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[8, 21, 24, 27]]);
      }));

      function overwriteFileAsync(_x9) {
        return _ref15.apply(this, arguments);
      }

      return overwriteFileAsync;
    }()

    // rename a directory or file

  }, {
    key: 'renameAsync',
    value: function () {
      var _ref17 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee5(_ref18) {
        var userUUID = _ref18.userUUID,
            targetUUID = _ref18.targetUUID,
            dirUUID = _ref18.dirUUID,
            name = _ref18.name;
        var dirnode, node, newPath, xstat;
        return _regenerator2.default.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                dirnode = this.data.findNodeByUUID(dirUUID);
                node = this.data.findNodeByUUID(targetUUID);

                if (dirnode) {
                  _context5.next = 4;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 4:
                if (node) {
                  _context5.next = 6;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 6:
                if (this.userWritable(userUUID, dirnode)) {
                  _context5.next = 8;
                  break;
                }

                throw new _error4.default.EACCESS();

              case 8:
                if (!(typeof name !== 'string' || path.basename(path.normalize(name)) !== name)) {
                  _context5.next = 10;
                  break;
                }

                throw new _error4.default.EINVAL();

              case 10:
                newPath = path.join(dirnode.abspath(), name);
                _context5.prev = 11;
                _context5.next = 14;
                return (0, _bluebird.resolve)(fs.renameAsync(node.abspath(), newPath));

              case 14:
                _context5.next = 16;
                return (0, _bluebird.resolve)((0, _xstat.readXstatAsync)(newPath));

              case 16:
                xstat = _context5.sent;

                this.data.updateNode(node, xstat);
                return _context5.abrupt('return');

              case 21:
                _context5.prev = 21;
                _context5.t0 = _context5['catch'](11);
                throw _context5.t0;

              case 24:
                _context5.prev = 24;

                if (node.parent) this.data.requestProbeByUUID(node.parent);else if (node.isDirectory()) this.data.requestProbeByUUID(targetUUID);
                return _context5.finish(24);

              case 27:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[11, 21, 24, 27]]);
      }));

      function renameAsync(_x10) {
        return _ref17.apply(this, arguments);
      }

      return renameAsync;
    }()

    // TODO: move a directory or file into given dirUUID

  }, {
    key: 'move',
    value: function move(userUUID, srcUUID, dirUUID, callback) {}

    // delete a directory or file
    // dirUUID cannot be a fileshare UUID

  }, {
    key: 'del',
    value: function () {
      var _ref19 = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee6(_ref20) {
        var userUUID = _ref20.userUUID,
            dirUUID = _ref20.dirUUID,
            nodeUUID = _ref20.nodeUUID;
        var share, dirNode, node;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                share = this.shareData.findShareByUUID(dirUUID);

                if (!share) {
                  _context6.next = 3;
                  break;
                }

                throw new _error4.default.ENOENT();

              case 3:
                dirNode = this.data.findNodeByUUID(dirUUID);

                if (dirNode) {
                  _context6.next = 6;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 6:
                if (dirNode.isDirectory()) {
                  _context6.next = 8;
                  break;
                }

                throw new _error4.default.ENOTDIR();

              case 8:
                node = this.data.findNodeByUUID(nodeUUID);

                if (node) {
                  _context6.next = 11;
                  break;
                }

                throw new _error4.default.ENODENOTFOUND();

              case 11:
                if (this.userWritable(userUUID, node)) {
                  _context6.next = 13;
                  break;
                }

                throw new _error4.default.EACCESS();

              case 13:
                _context6.prev = 13;
                _context6.next = 16;
                return (0, _bluebird.resolve)((0, _async.rimrafAsync)(node.abspath()));

              case 16:
                _context6.next = 18;
                return (0, _bluebird.resolve)(this.data.deleteNode(node));

              case 18:
                return _context6.abrupt('return');

              case 21:
                _context6.prev = 21;
                _context6.t0 = _context6['catch'](13);
                throw _context6.t0;

              case 24:
                _context6.prev = 24;

                if (node.parent) this.data.requestProbeByUUID(node.parent);
                return _context6.finish(24);

              case 27:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[13, 21, 24, 27]]);
      }));

      function del(_x11) {
        return _ref19.apply(this, arguments);
      }

      return del;
    }()

    // for debug

  }, {
    key: 'printFiles',
    value: function printFiles(args, callback) {
      var data = this.data.print();
      console.log('printFiles', data);
      process.nextTick(function () {
        return callback(null, data);
      });
    }
  }, {
    key: 'register',
    value: function register(ipc) {
      var _this6 = this;

      // ipc.register('createFileCheck', this.createFileCheck.bind(this))

      // ipc.register('createFile', this.createFile.bind(this))
      ipc.register('createFile', function (args, callback) {
        return _this6.createFileAsync(args).asCallback(callback);
      });
      ipc.register('createLibraryFile', function (args, callback) {
        return _this6.createLibraryFileAsync(args).asCallback(callback);
      });
      ipc.register('rename', function (args, callback) {
        return _this6.renameAsync(args).asCallback(callback);
      });
      ipc.register('createDirectory', function (args, callback) {
        return _this6.createDirectory(args).asCallback(callback);
      });
      ipc.register('overwriteFile', function (args, callback) {
        return _this6.overwriteFileAsync(args).asCallback(callback);
      });
      ipc.register('list', function (args, callback) {
        return _this6.list(args).asCallback(callback);
      });
      ipc.register('navList', function (args, callback) {
        return _this6.navList(args).asCallback(callback);
      });
      ipc.register('tree', function (args, callback) {
        return _this6.tree(args).asCallback(callback);
      });
      ipc.register('navTree', function (args, callback) {
        return _this6.navTree(args).asCallback(callback);
      });
      ipc.register('readFile', function (args, callback) {
        return _this6.readFile(args).asCallback(callback);
      });
      ipc.register('del', function (args, callback) {
        return _this6.del(args).asCallback(callback);
      });

      ipc.register('printFiles', this.printFiles.bind(this));
    }
  }]);
  return FileService;
}();

exports.default = FileService;