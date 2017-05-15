'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _set = require('babel-runtime/core-js/set');

var _set2 = _interopRequireDefault(_set);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Media = function Media(digest) {
  (0, _classCallCheck3.default)(this, Media);

  this.digest = digest;
  this.type = '';
  this.metadata = null;
  this.nodes = new _set2.default();
  // this.shares = new Set()
}

// isEmpty() {
//   return this.nodes.size === 0 && this.shares.size === 0
// }
;

var MediaData = function () {
  function MediaData(modelData, fileData, fileShareData, mediaShareData) {
    var _this = this;

    (0, _classCallCheck3.default)(this, MediaData);


    // this.fileShareData = fileShareData
    this.fileData = fileData;
    // this.mediaShareData = mediaShareData
    this.map = new _map2.default();

    this.fileData.on('mediaAppeared', function (node) {
      return _this.handleMediaAppeared(node);
    });
    this.fileData.on('mediaDisappearing', function (node) {
      return _this.handleMediaDisappearing(node);
    });
    this.fileData.on('mediaIdentified', function (node, metadata) {
      return _this.mediaIdentified(node, metadata);
    });

    // this.mediaShareData.on('mediaShareCreated', shares => this.handleMediaShareCreated(shares))
    // this.mediaShareData.on('mediaShareUpdated', (oldShare, newShare) => this.handleMediaShareUpdated(oldShare, newShare))
    // this.mediaShareData.on('mediaShareDeleted', share => this.handleMediaShareDeleted(share))
  }

  (0, _createClass3.default)(MediaData, [{
    key: 'findMediaByHash',
    value: function findMediaByHash(hash) {
      return this.map.get(hash);
    }
  }, {
    key: 'handleMediaAppeared',
    value: function handleMediaAppeared(node) {

      var media = this.findMediaByHash(node.hash);
      if (!media) {
        media = new Media(node.hash);
        media.type = node.magic;
        media.nodes.add(node);
        this.map.set(node.hash, media);
      } else {
        media.nodes.add(node);
      }

      if (!media.metadata) node.identify();
    }
  }, {
    key: 'handleMediaDisappearing',
    value: function handleMediaDisappearing(node) {

      var media = this.findMediaByHash(node.hash);
      if (!media) {
        // log
        return;
      }

      media.nodes.delete(node);
      if (media.isEmpty()) this.map.delete(node.hash);
    }
  }, {
    key: 'mediaIdentified',
    value: function mediaIdentified(node, metadata) {
      var media = this.findMediaByHash(node.hash);
      if (!media) {
        return;
      } else {
        media.metadata = metadata;
      }
    }

    // indexMediaShare(share) {
    //   //FIXME:
    //   share.doc.contents.forEach(item => {
    //     let digest = item.digest
    //     let media = this.findMediaByHash(digest)
    //     if (media) {
    //       // use 2-tuple for faster check on both creator and member
    //       media.shares.add([item, share]) 
    //     } else {
    //       media = new Media(digest)
    //       media.shares.add([item, share])
    //       this.map.set(digest, media)
    //     }
    //   })
    // }

    // return all media objects that has item removed, but empty ones are not removed out of map
    // unindexMediaShare(share) {

    //   return share.doc.contents.reduce((acc, item) => {

    //     let media = this.findMediaByHash(item.digest)
    //     if (media) {
    //       if (media.shares.has([item, share])) {
    //         media.shares.delete([item, share])
    //         acc.push(media)
    //         return acc
    //       }
    //     }
    //     // let index = medium.sharedItems.findIndex(pair => pair[0] === item)
    //     // medium.sharedItems.splice(index, 1)
    //     // acc.push(medium)
    //     // return acc
    //   }, [])
    // }

  }, {
    key: 'cleanEmpty',
    value: function cleanEmpty(medias) {
      var _this2 = this;

      medias.forEach(function (media) {
        return media.isEmpty() && _this2.map.delete(media.digest);
      });
    }

    // handleMediaShareCreated(shares) {
    //   shares.forEach(share => this.indexMediaShare(share))
    // }

    // share { doc { contents: [ item {creator, digest} ] } }
    // handleMediaShareUpdated(oldShare, newShare) {

    //   // 1. splice all indexed item inside media object
    //   let spliced = this.unindexMediaShare(oldShare)

    //   // 2. index all new media.
    //   this.indexMediaShare(newShare)

    //   // 3. remove empty spliced.
    //   this.cleanEmpty(spliced)
    // }

    // handleMediaShareDeleted(share) {

    //   let spliced = this.unindexMediaShare(share)
    //   this.cleanEmpty(spliced)
    // }

    // mediaSharingStatus(userUUID, media) {

    //   let sharedWithOthers = false
    //   let sharedWithMe = false
    //   let sharedWithMeAvailable = false
    //   let sharesArr = Array.from(media.shares)
    //   let nodesArr = Array.from(media.nodes)

    //   //FIXME:
    //   for (let i = 0; i < sharesArr.length; i++) {

    //     let pair = sharesArr[i]
    //     let item = pair[0]
    //     let doc = pair[1].doc
    //     if (item.creator === userUUID) sharedWithOthers = true
    //     if (doc.maintainers.includes(userUUID) || doc.viewers.includes(userUUID)) {
    //       sharedWithMe = true
    //       sharedWithMeAvailable = this.model.userIsLocal(doc.author) ?
    //         true :
    //         nodesArr.some(node => this.fileData.fromUserService(doc.author, node))
    //     }

    //     // if available is false, there is a chance that
    //     // another remote user shared the same medium with me
    //     if (sharedWithOthers && sharedWithMe && sharedWithMeAvailable)
    //       return {
    //         sharedWithOthers,
    //         sharedWithMe,
    //         sharedWithMeAvailable
    //       }
    //   }

    //   return {
    //     sharedWithOthers,
    //     sharedWithMe,
    //     sharedWithMeAvailable
    //   }
    // }

  }, {
    key: 'mediaProperties',
    value: function mediaProperties(userUUID, media) {
      var _this3 = this;

      var props = {
        permittedToShare: false
        // authorizedToRead: false,
        // sharedWithOthers: false,
        // sharedWithMe: false
      };
      var nodes = (0, _from2.default)(media.nodes);
      // let shares = Array.from(media.shares)
      // 1. user permitted to share (from fileData)
      // 2. from user library (from fileData)
      props.permittedToShare = nodes.some(function (node) {
        return _this3.fileData.userPermittedToShare(userUUID, node);
      });

      // // 3. user authorized to read (from fileShareData)
      // props.authorizedToRead = nodes.some(node => 
      //   this.fileShareData.userAuthorizedToRead(userUUID, node)) 
      // // 4. shared with others 
      // props.sharedWithOthers = shares.some(share => 
      //   this.mediaShareData.sharedWithOthers(userUUID, share))
      // // 5. shared with me
      // props.sharedWithMe = shares.some(share => 
      //   this.mediaShareData.sharedWithMe(userUUID, share))
      // 5.1 serviceAvailable 
      if (!props.sharedWithMe) {
        props.serviceAvailable = nodes.some(function (node) {
          return _this3.fileData.fromUserService(userUUID, node);
        });
      }
      return props;
    }

    // mediaShareAllowed(userUUID, digest) {
    //   let media = this.findMediaByHash(digest)
    //   if(!media) return
    //   else {
    //     let nodes = Array.from(media.nodes)
    //     return nodes.some(node => this.fileData.userPermittedToShare(userUUID, node))
    //   }
    // }

  }, {
    key: 'getAllMedia',
    value: function getAllMedia(userUUID) {

      var map = new _map2.default();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = (0, _getIterator3.default)(this.map), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var pair = _step.value;

          var props = this.mediaProperties(userUUID, pair[1]);

          if (props.permittedToShare || props.authorizedToRead || props.sharedWithOthers || props.sharedWithMe) {
            //put authorization in metadata
            map.set(pair[0], {
              metadata: pair[1].metadata,
              permittedToShare: props.permittedToShare
              // authorizedToRead: props.authorizedToRead,
              // sharedWithOthers: props.sharedWithOthers,
              // sharedWithMe: props.sharedWithMe
            });
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return map;
    }
  }]);
  return MediaData;
}();

exports.default = MediaData;