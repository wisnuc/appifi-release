'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fstree = require('./fstree');

var scan = function scan(root, callback) {

  var paths = [];
  var nodes = [];

  (0, _fstree.list)(root, 2, function (err, node) {

    if (err) return callback(err);
    node.children.forEach(function (sub) {

      if (sub.type !== 'folder') return;
      if (sub.name === 'wisnuc') return;
      if (sub.name === 'timemachine') return;
      if (sub.name === 'nobody') {
        if (sub.children) {
          sub.children.forEach(function (subsub) {
            if (subsub.type !== 'folder') return;
            paths.push(subsub.path);
          });
        }
        return;
      }

      paths.push(sub.path);
    });

    // now we have personal && shared paths 
    if (paths.length === 0) return callback(null, []);
    var count = paths.length;
    paths.forEach(function (dirpath) {
      (0, _fstree.list)(dirpath, 3, function (err, tree) {
        if (!err) nodes.push(tree);
        if (! --count) return callback(null, nodes);
      });
    });
  });
};

var visit = function visit(node, func) {

  if (node.children) {
    node.children.forEach(function (child) {
      return visit(child, func);
    });
  }

  func(node);
};

var scan2 = function scan2(root, callback) {

  scan(root, function (err, nodes) {

    if (err) return callback(err);
    nodes.forEach(function (node) {
      visit(node, function (n) {
        return n.path = n.path.slice(root.length + 1);
      });
    });
    callback(null, nodes);
  });
};

exports.default = scan2;