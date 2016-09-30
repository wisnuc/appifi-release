'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDrive = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _rimraf = require('rimraf');

var _rimraf2 = _interopRequireDefault(_rimraf);

var _xstat = require('./xstat');

var _indexedTree = require('./indexedTree');

var _util = require('./util');

var _visitors = require('./visitors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var driveVisitor = function driveVisitor(dir, node, entry, callback) {

  var entrypath = _path2.default.join(dir, entry);
  (0, _xstat.readXstat)(entrypath, function (err, xstat) {
    if (err) return callback();
    var object = (0, _util.mapXstatToObject)(xstat);
    var entryNode = node.tree.createNode(node, object);
    if (!xstat.isDirectory()) return callback();
    callback(entryNode);
  });
};

var createDrive = function createDrive(conf) {
  return new Drive(conf);
};

var Drive = function (_IndexedTree) {
  (0, _inherits3.default)(Drive, _IndexedTree);

  function Drive(conf) {
    (0, _classCallCheck3.default)(this, Drive);

    var proto = {};
    return (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Drive).call(this, proto));
  }

  // uuid, type, name, owner, readlist, writelist
  // rootpath


  (0, _createClass3.default)(Drive, [{
    key: 'attachDrive',
    value: function attachDrive(props, rootpath) {
      var node = this.createNode(null, props);
    }
  }, {
    key: 'buildCache',
    value: function buildCache() {

      if (this.cacheState !== 'NONE') throw new Error('buildCache can only be called when cacheState is NONE');

      this.cacheState = 'CREATING';
      this.createNode(null, {
        uuid: this.uuid,
        type: 'folder',
        owner: this.owner,
        writelist: this.writelist,
        readlist: this.readlist,
        name: this.rootpath
      });

      var drive = this;
      (0, _visitors.visit)(this.rootpath, this.root, driveVisitor, function () {
        drive.cacheState = 'CREATED';
        drive.emit('driveCached', drive);
      });
    }
  }, {
    key: 'scan',
    value: function scan(node, callback) {

      var X = this;

      var visitor = function visitor(dir, node, entry, callback) {
        var entrypath = _path2.default.join(dir, entry);
        (0, _xstat.readXstat)(entrypath, function (err, xstat) {
          if (err) return callback();
          var object = (0, _util.mapXstatToObject)(xstat);
          var entryNode = X.createNode(node, object);
          if (!xstat.isDirectory()) return callback();
          callback(entryNode);
        });
      };

      (0, _visitors.visit)(node.namepath(), node, visitor, function () {
        return callback(null);
      });
    }

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
      var _this2 = this;

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
          var node = _this2.createNode(targetNode, obj);
          callback(null, node);
        });
      });
    }
  }, {
    key: 'createFile',
    value: function createFile(userUUID, srcpath, targetNode, filename, callback) {
      var _this3 = this;

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
          var node = _this3.createNode(targetNode, obj);
          callback(null, node);
        });
      });
    }
  }, {
    key: 'overwriteFile',
    value: function overwriteFile(userUUID, srcpath, targetNode, callback) {
      var _this4 = this;

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
            _this4.updateNode(targetNode, obj); // TODO
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
      var _this5 = this;

      var newPath = _path2.default.join(folder.namepath(), newName);
      _fs2.default.rename(node.namepath(), newPath, function (err) {
        if (err) return callback(err);
        (0, _xstat.readXstat)(newPath, function (err, xstat) {
          if (err) return callback(err);
          var obj = (0, _util.mapXstatToObject)(xstat);
          _this5.updateNode(node, obj);
          callback(null, node);
        });
      });
    }
  }, {
    key: 'updatePermission',
    value: function updatePermission(userUUID, folder, node, obj, callback) {
      var _this6 = this;

      if (!node.isRootOwner(userUUID)) {
        var error = new Error('permission denied');
        error.code = 'EACCESS';
        return process.nextTick(callback, error);
      }

      (0, _xstat.updateXattrPermission)(node.namepath(), node.uuid, obj.writelist, obj.readlist, function (err, xstat) {

        if (err) return callback(err);
        var obj = (0, _util.mapXstatToObject)(xstat);
        _this6.updateNode(node, obj);
        callback(null, node);
      });
    }
  }, {
    key: 'deleteFileOrFolder',
    value: function deleteFileOrFolder(userUUID, folder, node, callback) {
      var _this7 = this;

      if (!folder.userWritable(userUUID)) {
        var error = new Error('permission denied');
        error.code = 'EACCESS';
        return process.nextTick(callback, error);
      }

      (0, _rimraf2.default)(node.namepath(), function (err) {
        if (err) return callback(err);
        _this7.deleteSubTree(node);
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
      var _this8 = this;

      // update file first
      (0, _xstat.updateXattrHashMagic)(target, uuid, hash, magic, timestamp, function (err, xstat) {
        if (err) return callback(err);
        var node = _this8.uuidMap.get(uuid);
        if (!node) return callback(new Error('node not found')); // TODO really weird! is this possible?
        _this8.updateNode(node, (0, _util.mapXstatToObject)(xstat));
        callback(null);
      });
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
    key: 'getMedia',
    value: function getMedia(userUUID) {

      var arr = [];

      this.hashMap.forEach(function (digestObj, digest) {
        for (var i = 0; i < digestObj.nodes.length; i++) {
          if (digestObj.nodes[i].userReadable(userUUID)) {
            arr.push((0, _assign2.default)({ digest: digest }, digestObj.meta));
          }
        }
      });

      return arr;
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
  }]);
  return Drive;
}(_indexedTree.IndexedTree);

exports.createDrive = createDrive;