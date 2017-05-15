'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFiler = exports.Forest = undefined;

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _xstat = require('./xstat');

var _indexedTree = require('./indexedTree');

var _util = require('./util');

var _visitors = require('./visitors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('fruitmix:filer');

var ERROR = function ERROR(code, _text) {
  return function (text) {
    return (0, _assign2.default)(new Error(text || _text), { code: code });
  };
};

var EFAIL = ERROR('EFAIL', 'operation failed');
var EINVAL = ERROR('EINVAL', 'invalid argument');
var EINTR = ERROR('EINTR', 'operation interrupted');
var ENOENT = ERROR('ENOENT', 'entry not found');
var EMISMATCH = ERROR('EMISMATCH', 'uuid mismatch');

var Forest = exports.Forest = function (_IndexedTree) {
  (0, _inherits3.default)(Forest, _IndexedTree);

  function Forest() {
    (0, _classCallCheck3.default)(this, Forest);

    var proto = {};

    var _this = (0, _possibleConstructorReturn3.default)(this, (Forest.__proto__ || (0, _getPrototypeOf2.default)(Forest)).call(this, proto));

    _this.collations = new _map2.default();
    return _this;
  }

  (0, _createClass3.default)(Forest, [{
    key: 'createRoot',
    value: function createRoot(props) {

      var root = this.createNode(null, props);
      if (root) this.requestProbe(root);
      return root;
    }

    // rename to probe TODO

  }, {
    key: 'probe',
    value: function probe(node) {
      var _this2 = this;

      var finished = false;
      var uuid = node.uuid;

      var target = node.namepath();
      var mtime = node.mtime;
      var mtime1 = void 0,
          mtime2 = void 0,
          children = [];

      _fs2.default.stat(target, function (err, stats) {

        if (finished) return;
        if (err) return finish(err);
        if (stats.mtime.getTime() === mtime) return finish(null);

        mtime1 = stats.mtime.getTime();
        _fs2.default.readdir(target, function (err, entries) {

          if (finished) return;
          if (err) return finish(err);
          if (entries.length === 0) {
            readXstatAgain();
          } else {
            var count = entries.length;
            entries.forEach(function (entry) {
              (0, _xstat.readXstat)(_path2.default.join(target, entry), function (err, xstat) {
                if (finished) return;
                if (!err) children.push(xstat); // bypass error
                if (! --count) readXstatAgain();
              });
            });
          }
        });

        function readXstatAgain() {

          _fs2.default.stat(target, function (err, stat2) {
            if (finished) return;
            if (err) return finish(err);
            mtime2 = stat2.mtime.getTime();
            finish(null);
          });
        }
      }); // end of readXstat

      var finish = function finish(err) {

        // target path or name change is irrelevant
        // if node is deleted, blame where it is deleted failing to remove this job
        // so timestamp check should be enough
        if (err) {
          if (node.parent) // a quickfix, not sure TODO FIXME
            _this2.requestProbe(node.parent);
          finishJob(false);
        } else if (mtime1 === mtime) {
          finishJob(false);
        } else if (mtime1 !== mtime2) {
          finishJob(true);
        } else {
          // compare children, create a map first
          var map = new _map2.default();
          children.forEach(function (xstat) {
            return map.set(xstat.uuid, xstat);
          });

          // first round, remove all children not found in xstats
          node.getChildren().filter(function (child) {
            return !map.has(child.uuid);
          }).forEach(function (child) {
            return _this2.deleteSubTree(child);
          });

          // second round, update existing thing if necessary
          node.getChildren().forEach(function (child) {

            var xstat = map.get(child.uuid);
            _this2.updateNode(child, (0, _util.mapXstatToObject)(xstat));
            if (xstat.isDirectory() && xstat.mtime.getTime() !== child.mtime) _this2.requestProbe(child); // TODO

            map.delete(child.uuid);
          });

          // third round, add new node
          (0, _from2.default)(map.values()).forEach(function (xstat) {
            var child = _this2.createNode(node, (0, _util.mapXstatToObject)(xstat));
            if (xstat.isDirectory()) _this2.requestProbe(child); // TODO
          });

          node.mtime = mtime2;
          finishJob(false);
        }
      };

      var finishJob = function finishJob(again) {

        var job = _this2.collations.get(node);
        if (again || job.again) {
          job.again = false;
          job.abort = _this2.probe(node);
        } else {
          _this2.collations.delete(node);
          if (_this2.collations.size === 0) {
            process.nextTick(function () {
              return _this2.emit('probeStopped');
            });
          }
        }
      };

      function abort() {
        finished = true;
      }
    }

    // a job is key value pair
    // key:   uuid
    // value: { abort, again }

    // callback is optional TODO

  }, {
    key: 'requestProbe',
    value: function requestProbe(node, callback) {
      var _this3 = this;

      debug('requestProbe ' + node.uuid + ' ' + node.name);

      // find job with the same uuid (aka, collating the same node)
      var job = this.collations.get(node);

      // creat a job if not found
      if (!job) {
        this.collations.set(node, {
          abort: this.probe(node),
          again: false
        });

        if (this.collations.size === 1) {
          process.nextTick(function () {
            return _this3.emit('probeStarted');
          });
        }
      } else if (!job.again) {
        job.again = true;
      }

      return this;
    }

    // quick and dirty

  }, {
    key: 'requestProbeByAudit',
    value: function requestProbeByAudit(audit) {

      debug('requestProbeByAudit, audit', audit);
      var uuid = _path2.default.basename(audit.abspath);

      debug('requestProbeByAudit, uuid', uuid);
      var root = this.roots.find(function (r) {
        return r.uuid === uuid;
      });
      if (!root) {
        debug('no root found with given uuid');
        return;
      }

      debug('requestProbeByAudit, arg0', audit.arg0);

      var names = audit.arg0.split('/').filter(function (name) {
        return name.length;
      });

      var node = root.walkDown(names);
      debug('requestProbeByAudit, walk', names, node);

      if (node.isDirectory()) this.requestProbe(node);
    }
  }, {
    key: 'reportNodeMissing',
    value: function reportNodeMissing(node) {}
  }, {
    key: 'reportNodeMismatch',
    value: function reportNodeMismatch(node) {}
  }, {
    key: 'reportNodeHashOutdated',
    value: function reportNodeHashOutdated(node) {}

    // v createFolder   targetNode (parent), new name
    // v createFile     targetNode (parent), new name, file, optional digest?
    //   renameFolder   targetNode, new name (not conflicting) 
    //   renameFile     targetNode, new name (not conflicting)
    //   deleteFolder   targetNode, 
    //   deleteFile     targetNode,
    // v listFolder     get node is enough, no operation
    // v readFile       get a path is enough, no operation
    // v overwriteFile  overwrite but preserve uuid
    //   chmod

  }, {
    key: 'listFolder',
    value: function listFolder(userUUID, folderUUID) {

      debug('listFolder', userUUID, folderUUID);

      var node = this.findNodeByUUID(folderUUID);
      if (!node) {
        var e = new Error('listFolder: ' + folderUUID + ' not found');
        e.code = 'ENOENT';
        return e;
      }

      if (!node.isDirectory()) {
        var _e = new Error('listFolder: ' + folderUUID + ' is not a folder');
        _e.code = 'ENOTDIR';
        return _e;
      }

      if (!node.userReadable(userUUID)) {
        var _e2 = new Error('listFolder: ' + folderUUID + ' not accessible for given user ' + userUUID);
        _e2.code = 'EACCESS';
        return _e2;
      }

      return node.getChildren().map(function (n) {
        if (n.isDirectory()) {
          return {
            uuid: n.uuid,
            type: 'folder',
            owner: n.owner,
            writelist: n.writelist,
            readlist: n.readlist,
            name: n.name
          };
        } else if (n.isFile()) {
          return {
            uuid: n.uuid,
            type: 'file',
            owner: n.owner,
            writelist: n.writelist,
            readlist: n.readlist,
            name: n.name,
            mtime: n.mtime,
            size: n.size
          };
        } else return null;
      }).filter(function (n) {
        return !!n;
      });
    }
  }, {
    key: 'navFolder',
    value: function navFolder(userUUID, folderUUID, rootUUID) {

      debug('navFolder', userUUID, folderUUID, rootUUID);

      var node = this.findNodeByUUID(folderUUID);
      if (!node) {
        var e = new Error('listFolder: ' + folderUUID + ' not found');
        e.code = 'ENOENT';
        return e;
      }

      if (!node.isDirectory()) {
        var _e3 = new Error('listFolder: ' + folderUUID + ' is not a folder');
        _e3.code = 'ENOTDIR';
        return _e3;
      }

      var root = this.findNodeByUUID(rootUUID);
      if (!root) {
        var _e4 = new Error('listFolder: ' + rootUUID + ' not found');
        _e4.code = 'ENOENT';
        return _e4;
      }

      var path = node.nodepath();
      var index = path.indexOf(root);
      debug('navFolder, index', index);

      if (index === -1) {
        var _e5 = new Error('listFolder: ' + rootUUID + ' not an ancestor of ' + folderUUID);
        _e5.code = 'EINVAL';
        return _e5;
      }

      debug('navFolder, path', path);

      var subpath = path.slice(index);
      if (!subpath.every(function (n) {
        return n.userReadable(userUUID);
      })) {
        var _e6 = new Error('listFolder: not all ancestors accessible for given user ' + userUUID);
        _e6.code = 'EACCESS';
        return _e6;
      }

      debug('navFolder, subpath', subpath);

      return {
        path: subpath.map(function (n) {
          if (n.isDirectory()) {
            return {
              uuid: n.uuid,
              type: 'folder',
              owner: n.owner,
              writelist: n.writelist,
              readlist: n.readlist,
              name: n.name
            };
          } else if (n.isFile()) {
            return {
              uuid: n.uuid,
              type: 'file',
              owner: n.owner,
              writelist: n.writelist,
              readlist: n.readlist,
              name: n.name,
              mtime: n.mtime,
              size: n.size
            };
          } else return null;
        }).filter(function (n) {
          return !!n;
        }),

        children: node.getChildren().map(function (n) {
          if (n.isDirectory()) {
            return {
              uuid: n.uuid,
              type: 'folder',
              owner: n.owner,
              writelist: n.writelist,
              readlist: n.readlist,
              name: n.name
            };
          } else if (n.isFile()) {
            return {
              uuid: n.uuid,
              type: 'file',
              owner: n.owner,
              writelist: n.writelist,
              readlist: n.readlist,
              name: n.name,
              mtime: n.mtime,
              size: n.size
            };
          } else return null;
        }).filter(function (n) {
          return !!n;
        })
      };
    }
  }, {
    key: 'readFile',
    value: function readFile(userUUID, fileUUID) {

      var node = this.findNodeByUUID(fileUUID);
      if (!node) {
        return 'ENOENT';
      }

      if (!node.isFile()) {
        return 'EINVAL';
      }

      if (!node.userReadable(userUUID)) {
        return 'EACCESS';
      }

      return node.namepath();
    }

    // create a folder in targetNode with given name

  }, {
    key: 'createFolder',
    value: function createFolder(userUUID, targetNode, name, callback) {
      var _this4 = this;

      // if not directory, EINVAL
      if (!targetNode.isDirectory()) {
        var error = new Error('createFolder: target should be a folder');
        error.code = 'EINVAL';
        return process.nextTick(callback, error);
      }

      // if not writable, EACCESS
      if (!targetNode.userWritable(userUUID)) {
        var _error = new Error('createFolder: operation not permitted');
        _error.code = 'EACCESS';
        return process.nextTick(callback, _error);
      }

      // if already exists, EEXIST
      if (targetNode.getChildren().find(function (c) {
        return c.name === name;
      })) {
        var _error2 = new Error('createFolder: file or folder already exists');
        _error2.code = 'EEXIST';
        return process.nextTick(callback, _error2);
      }

      var targetpath = _path2.default.join(targetNode.namepath(), name);
      _fs2.default.mkdir(targetpath, function (err) {
        if (err) return callback(err);
        (0, _xstat.readXstat)(targetpath, { owner: [userUUID] }, function (err, xstat) {
          if (err) return callback(err);
          var obj = (0, _util.mapXstatToObject)(xstat);
          var node = _this4.createNode(targetNode, obj);
          callback(null, node);
        });
      });
    }
  }, {
    key: 'createFile',
    value: function createFile(userUUID, srcpath, targetNode, filename, callback) {
      var _this5 = this;

      if (!targetNode.isDirectory()) {
        var error = new Error('createFile: target must be a folder');
        error.code = 'EINVAL';
        return process.nextTick(callback, error);
      }

      if (!targetNode.userWritable(userUUID)) {
        var _error3 = new Error('createFile: operation not permitted');
        _error3.code = 'EACCESS';
        return process.nextTick(callback, _error3);
      }

      if (targetNode.getChildren().find(function (c) {
        return c.name === filename;
      })) {
        var _error4 = new Error('createFile: file or folder already exists');
        _error4.code = 'EEXIST';
        return process.nextTick(callback, _error4);
      }

      var targetpath = _path2.default.join(targetNode.namepath(), filename);
      _fs2.default.rename(srcpath, targetpath, function (err) {
        if (err) return callback(err);
        (0, _xstat.readXstat)(targetpath, { owner: [userUUID] }, function (err, xstat) {
          if (err) return callback(err);
          var obj = (0, _util.mapXstatToObject)(xstat);
          var node = _this5.createNode(targetNode, obj);
          callback(null, node);
        });
      });
    }
  }, {
    key: 'overwriteFile',
    value: function overwriteFile(userUUID, srcpath, targetNode, callback) {
      var _this6 = this;

      if (!targetNode.isFile()) {
        var error = new Error('overwriteFile: target must be a file');
        error.code = 'EINVAL';
        return process.nextTick(callback, error);
      }

      if (!targetNode.userWritable(userUUID)) {
        var _error5 = new Error('overwriteFile: operation not permitted');
        _error5.code = 'EPERM';
        return process.nextTick(callback, _error5);
      }

      var targetpath = targetNode.namepath();
      (0, _xstat.copyXattr)(srcpath, targetpath, function (err) {
        if (err) return callback(err);
        _fs2.default.rename(srcpath, targetpath, function (err) {
          if (err) return callback(err);
          (0, _xstat.readXstat)(targetpath, function (err, xstat) {
            if (err) return callback(err);
            var obj = (0, _util.mapXstatToObject)(xstat);
            _this6.updateNode(targetNode, obj); // TODO
            callback(null, targetNode);
          });
        });
      });
    }

    // this function is used to check if it is allowed and viable to do importFile
    // return true or false

  }, {
    key: 'importFileCheck',
    value: function importFileCheck(userUUID, targetNode, filename) {

      return true;
    }

    // this function may OVERWRITE existing file

  }, {
    key: 'importFile',
    value: function importFile(userUUID, srcpath, targetNode, filename, callback) {

      var targetpath = _path2.default.join(this.abspath(targetNode), filename);
      var existing = targetNode.getChildren().find(function (c) {
        return c.name === filename;
      });
      if (existing) {
        // !!! reverse order
        return (0, _xstat.copyXattr)(srcpath, targetpath, function (err) {
          if (err) return callback(err);
          _fs2.default.rename(srcpath, targetpath, function (err) {
            if (err) return callback(err);
            (0, _xstat.readXstat)(targetpath, function (err, xstat) {
              if (err) return callback(err);
              var obj = (0, _util.mapXstatToObject)(xstat);
              var tree = existing.tree;
              tree.updateNode(existing, obj);
              callback(null, existing);
            });
          });
        });
      }

      _fs2.default.rename(srcpath, targetpath, function (err) {
        if (err) return callback(err);
        (0, _xstat.readXstat)(targetpath, { owner: [userUUID] }, function (err, xstat) {
          if (err) return callback(err);
          var obj = (0, _util.mapXstatToObject)(xstat);
          var node = targetNode.tree.createNode(targetNode, obj);
          callback(null, node);
        });
      });
    }

    // rename TODO FIXME

  }, {
    key: 'rename',
    value: function rename(userUUID, folder, node, newName, callback) {
      var _this7 = this;

      var newPath = _path2.default.join(folder.namepath(), newName);
      _fs2.default.rename(node.namepath(), newPath, function (err) {
        if (err) return callback(err);
        (0, _xstat.readXstat)(newPath, function (err, xstat) {
          if (err) return callback(err);
          var obj = (0, _util.mapXstatToObject)(xstat);
          _this7.updateNode(node, obj);
          callback(null, node);
        });
      });
    }
  }, {
    key: 'updatePermission',
    value: function updatePermission(userUUID, folder, node, obj, callback) {
      var _this8 = this;

      if (!node.isRootOwner(userUUID)) {
        var error = new Error('permission denied');
        error.code = 'EACCESS';
        return process.nextTick(callback, error);
      }

      (0, _xstat.updateXattrPermission)(node.namepath(), node.uuid, obj.writelist, obj.readlist, function (err, xstat) {

        if (err) return callback(err);
        var obj = (0, _util.mapXstatToObject)(xstat);
        _this8.updateNode(node, obj);
        callback(null, node);
      });
    }
  }, {
    key: 'deleteFileOrFolder',
    value: function deleteFileOrFolder(userUUID, folder, node, callback) {
      var _this9 = this;

      if (!folder.userWritable(userUUID)) {
        var error = new Error('permission denied');
        error.code = 'EACCESS';
        return process.nextTick(callback, error);
      }

      (0, _rimraf2.default)(node.namepath(), function (err) {
        if (err) return callback(err);
        _this9.deleteSubTree(node);
        callback(null);
      });
    }
  }, {
    key: 'print',
    value: function print(uuid) {

      if (!uuid) uuid = this.root.uuid;
      var node = this.uuidMap.get(uuid);
      if (!node) {
        console.log('no node found to have uuid: ' + uuid);
        return;
      }

      var queue = [];
      node.preVisit(function (n) {
        var obj = {
          parent: n.parent === null ? null : n.parent.uuid,
          uuid: n.uuid,
          type: n.type,
          owner: n.owner,
          writelist: n.writelist,
          readlist: n.readlist,
          name: n.name
        };
        queue.push(obj);
      });

      return queue;
    }
  }, {
    key: 'updateHashMagic',
    value: function updateHashMagic(target, uuid, hash, magic, timestamp, callback) {
      var _this10 = this;

      // update file first
      // besides system error, this function may returns
      // EINVAL, EMISMATCH, EOUTDATED
      (0, _xstat.updateXattrHashMagic)(target, uuid, hash, magic, timestamp, function (err, xstat) {
        if (err) return callback(err);
        var node = _this10.findNodeByUUID(uuid);
        if (!node) {
          // this is a weird case but possible, say right after
          // updateXattrHashMagic's last operation finished the node is deleted
          // but we have nothing to do, so pretend everything is fine
          // need more consideration and should test and log it TODO
          return callback(null);
        }
        _this10.updateNode(node, (0, _util.mapXstatToObject)(xstat));
        callback(null);
      });
    }
  }, {
    key: 'updateFileNode',
    value: function updateFileNode(xstat) {

      if (!xstat.isFile()) return;

      var node = this.findNodeByUUID(xstat.uuid);
      if (!node) return;
      if (!node.isFile()) return;

      this.updateNode(node, (0, _util.mapXstatToObject)(xstat));
    }

    //////////////////////////////////////////////////////////////////////////////
    //
    // for share api
    //

  }, {
    key: 'getSharedWithMe',
    value: function getSharedWithMe(userUUID) {

      var arr = [];

      this.shared.forEach(function (node) {

        if (node.root().owner.find(function (uuid) {
          return uuid === userUUID;
        })) return;
        if (node.writelist.find(function (uuid) {
          return uuid === userUUID;
        }) || node.readlist.find(function (uuid) {
          return uuid === userUUID;
        })) {

          var props = (0, _assign2.default)({}, node, {
            name: undefined,
            parent: undefined,
            children: undefined
          });

          props.root = node.root().uuid;

          arr.push(props);
        }
      });

      return arr;
    }
  }, {
    key: 'getSharedWithOthers',
    value: function getSharedWithOthers(userUUID) {

      var arr = [];

      this.shared.forEach(function (node) {

        if (node.root().owner.find(function (uuid) {
          return uuid === userUUID;
        })) {

          var props = (0, _assign2.default)({}, node, {
            name: undefined,
            parent: undefined,
            children: undefined
          });

          props.root = node.root().uuid;

          arr.push(props);
        }
      });

      return arr;
    }

    //////////////////////////////////////////////////////////////////////////////

  }, {
    key: 'mediaUserReadable',
    value: function mediaUserReadable(digest, userUUID) {

      var digestObj = this.hashMap.get(digest);
      if (!digestObj) return false;

      var node = digestObj.nodes.find(function (n) {
        return n.userReadable(userUUID);
      });
      return !!node;
    }

    // this is a two step calculation, this is the first one:

  }, {
    key: 'initMediaMap',
    value: function initMediaMap(userUUID) {

      //  map: digest => obj
      //  obj: {
      //    digest,
      //    type,
      //    meta,
      //    share, not defined here
      //  }

      var map = new _map2.default();
      this.hashMap.forEach(function (digestObj, digest) {

        // find at least one that user readable
        if (digestObj.nodes.find(function (node) {
          return node.userReadable(userUUID);
        })) {
          var obj = { digest: digest, type: digestObj.type };
          if (digestObj.meta) (0, _assign2.default)(obj, digestObj.meta);
          obj.sharing = 1;
          map.set(digest, obj);
        }
      });

      return map;
    }
  }, {
    key: 'readMedia',
    value: function readMedia(userUUID, digest) {

      var digestObj = this.hashMap.get(digest);
      if (!digestObj) return;

      for (var i = 0; i < digestObj.nodes.length; i++) {
        var node = digestObj.nodes[i];
        if (node.userReadable(userUUID)) return node.namepath();
      }
    }
  }, {
    key: 'readMediaPath',
    value: function readMediaPath(digest) {

      var digestObj = this.hashMap.get(digest);
      if (!digestObj) return;

      for (var i = 0; i < digestObj.nodes.length; i++) {
        var node = digestObj.nodes[i];
        return node.namepath();
      }
    }

    //////////////////////////////////////////////////////////////////////////////


    // for meta api

  }, {
    key: 'getMeta',
    value: function getMeta(userUUID) {

      var arr = [];
      this.hashMap.forEach(function (digestObj, digest) {
        if (digestObj.nodes.find(function (node) {
          return node.userReadable(userUUID);
        })) arr.push((0, _assign2.default)({}, digestObj.meta, { digest: digest }));
      });

      return arr;
    }
  }]);
  return Forest;
}(_indexedTree.IndexedTree);

var createFiler = exports.createFiler = function createFiler() {
  return new Forest();
};