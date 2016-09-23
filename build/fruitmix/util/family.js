'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initFamilyRoot = exports.genUserToken = exports.getUsers = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _clone = require('clone');

var _clone2 = _interopRequireDefault(_clone);

var _bcryptjs = require('bcryptjs');

var _bcryptjs2 = _interopRequireDefault(_bcryptjs);

var _jwtSimple = require('jwt-simple');

var _jwtSimple2 = _interopRequireDefault(_jwtSimple);

var _paths = require('../lib/paths');

var _paths2 = _interopRequireDefault(_paths);

var _models = require('../models/models');

var _models2 = _interopRequireDefault(_models);

var _userModel = require('../models/userModel');

var _driveModel = require('../models/driveModel');

var _async = require('./async');

var _passportJwt = require('../config/passportJwt');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** UUIDs **/
var aliceUUID = "5da92303-33a1-4f79-8d8f-a7b6becde6c3";
var aliceHome = "b9aa7c34-8b86-4306-9042-396cf8fa1a9c";
var aliceLib = "f97f9e1f-848b-4ed4-bd47-1ddfa82b2777";

var bobUUID = "e5f23cb9-1852-475d-937d-162d2554e22c";
var bobHome = "ed1d9638-8130-4077-9ed8-05be641a9ab4";
var bobLib = "c18aa308-ab32-4e2d-bc34-0c6385711b55";

var charlieUUID = "1f4faecf-1bb5-4ff1-ab41-bd44a0cd0809";
var charlieHome = "6bd8cbad-3c7d-4a32-831b-0fadf3c8ef53";
var charlieLib = "1ec6533f-fab8-4fad-8e76-adc76f80aa2f";

var davidUUID = "3908afee-0818-4a3e-b327-76c2578ecb80";
var davidHome = "5292b85f-f15c-470d-845b-6d80d5caf79c";
var davidLib = "d3932743-7587-4c91-a3bd-776846f14f6b";

var emilyUUID = "831b5cc9-6a14-4a4f-b1b6-666c5b282783";
var emilyHome = "4d807647-0feb-4692-aea4-4eaf26232916";
var emilyLib = "4a8bf8dc-1467-4429-91e5-ef635055368c";

var frankUUID = "9d4873e2-c0b7-4541-b535-87d5fd637f70";
var frankHome = "93858ec9-57ef-45cb-8201-8aa1fc57ad40";
var frankLib = "4cba25be-b1d4-4aed-8085-827bb2a07d3a";

var georgeUUID = "278a60cf-2ba3-4eab-8641-e9a837c12950";
var georgeHome = "bc097836-b056-46ef-862c-e0423e440b4c";
var georgeLib = "a9c4e86d-f20c-4002-b8c8-a824f911ae29";

var henryUUID = "04f91652-bd23-421b-854a-81b466c084bc";
var henryHome = "c9f1d82e-5d88-46d7-ad43-24d51b1b6628";
var henryLib = "e6f93d0a-144e-41fe-9afa-a03e1cccad8f";

var ianUUID = "bc53b2f7-045b-4e86-91b9-9b5731489a13";
var ianHome = "ec374b5a-490c-47ea-9a33-cb9ae1103b3b";
var ianLib = "b8ff0e08-0acb-4013-8129-a4d913e79339";

var janeUUID = "c190c542-c57c-47ea-96ab-643e95be23c6";
var janeHome = "574c0a58-09d9-4e0f-a22f-0a30b38b6255";
var janeLib = "d7dcaa59-217d-401d-a264-9e9148236792";

var kateUUID = "f3b846d3-ab25-42bf-9c2f-caa7b339902c";
var kateHome = "857689e7-ebe1-4c74-9c42-6bdcaf46071e";
var kateLib = "85c4c3dd-04ca-4508-85db-8e19d20d6dbe";

var leoUUID = "6e702f92-6073-4c11-a406-0a4776212d14";
var leoHome = "6f300568-3faa-41c3-870e-fcbbe923343d";
var leoLib = "ff5d42b9-4b8f-452d-a102-ebfde5cdf948";

var maryUUID = "2a55e63e-10d2-4b45-aa44-524ee1e5e5da";
var maryHome = "4dcb5c31-7500-4188-8602-b876a2c91b29";
var maryLib = "ad3c1ce8-ef19-48e3-bbfa-3d6b275276f3";

var nicoleUUID = "4ba43b18-326a-4011-90ce-ec78afca9c43";
var nicoleHome = "6790cdcb-8bce-4c67-9768-202a90aad8bf";
var nicoleLib = "8359f954-ade1-43e1-918e-8ca9d2dc81a0";

var oliviaUUID = "ff490ac4-138a-4491-9c23-b021fa403a8e";
var oliviaHome = "4a1ecce8-00af-4726-b0e7-03412a12a2b0";
var oliviaLib = "97e352f8-5535-473d-9dac-8706ffb79abb";

var peterUUID = "adde641e-2ab0-4d73-895f-78844d30cd97";
var peterHome = "2e770755-3ff7-4e10-b79b-9cd0337f940f";
var peterLib = "5e5393ca-0bd3-4f39-83d3-b0518340f292";

var quinnUUID = "76121355-8a44-4739-b1f6-3f6dcdbe4ae3";
var quinnHome = "592ae12f-b997-4a7d-ada7-50c9e53a0465";
var quinnLib = "75b5dac2-591a-4c63-8e5e-a955ce51b576";

var robbieUUID = "d5c9bb7b-6558-42ee-87da-a7c32abf2907";
var robbieHome = "a474d150-a7d4-47f2-8338-3733fa4b8783";
var robbieLib = "cd14ff07-c35f-48f0-81be-5b8fcaad38b2";

var sophieUUID = "ccadabf0-1af4-41a5-8028-8e3dfe09e94e";
var sophieHome = "cc1daf1c-adcb-45ea-a09d-6ec51b1e037e";
var sophieLib = "b8106597-7ad7-4913-92fe-86757f9d5e0d";

var tomUUID = "2648a820-6f84-4c29-a989-a6f0dd3e75e1";
var tomHome = "1a72fc51-668a-4740-807f-ca625592dfa2";
var tomLib = "8d2dfcfa-5dcc-4683-80f0-3d4020615143";

var ulyssesUUID = "69790809-251d-42bf-a1ab-182aa730a640";
var ulyssesHome = "dbe8957e-c0cc-451d-abd4-6d0b7a276a21";
var ulyssesLib = "e6d8729b-a120-4658-a91c-c53a16b5517f";

var vincentUUID = "d22fc1ea-aa3e-4fef-ac8e-8c5db9437ace";
var vincentHome = "8f2826a0-22e6-402d-8052-0a828ebdee7e";
var vincentLib = "11579501-c662-4ad6-981f-6f2ed6978186";

var williamUUID = "5655a5a0-eb8e-4be1-9705-bae2a5bfcb24";
var williamHome = "b6092e10-b58c-4e9a-af5d-e0e571126374";
var williamLib = "905ea680-9501-4ffe-b471-685bc241f9a5";

var xenaUUID = "a71beb7c-1df0-4211-849e-e8f77ce005c1";
var xenaHome = "2eb5446c-88f3-4cbb-a523-c6de17ee64a8";
var xenaLib = "294251fe-bd53-4492-8544-dc83b479c86a";

var yvonneUUID = "3cef7502-df7c-4845-96db-6a0eb10faf67";
var yvonneHome = "faef4600-51a3-400f-b367-a3020b1a6b1a";
var yvonneLib = "a1662400-003a-451e-b8f1-be797298533f";

var zoeyUUID = "634385bc-31c0-418d-b340-92cf0e0a038e";
var zoeyHome = "c7b74342-b169-425f-8929-546cadbec232";
var zoeyLib = "2bf5aa45-166e-405d-ac9b-f935f7b9131e";

var users = [{
  uuid: aliceUUID,
  username: 'Alice',
  password: null,
  avatar: null,
  email: null,
  isFirstUser: true,
  isAdmin: true,
  home: aliceHome,
  library: aliceLib
}, {
  uuid: bobUUID,
  username: 'Bob',
  password: null,
  avatar: null,
  email: null,
  isAdmin: true,
  home: bobHome,
  library: bobLib
}, {
  uuid: charlieUUID,
  username: 'Charlie',
  password: null,
  avatar: null,
  email: null,
  home: charlieHome,
  library: charlieLib
}, {
  uuid: davidUUID,
  username: 'David',
  password: null,
  avatar: null,
  email: null,
  home: davidHome,
  library: davidLib
}, {
  uuid: emilyUUID,
  username: 'Emily',
  password: null,
  avatar: null,
  email: null,
  home: emilyHome,
  library: emilyLib
}, {
  uuid: frankUUID,
  username: 'Frank',
  password: null,
  avatar: null,
  email: null,
  home: frankHome,
  library: frankLib
}, {
  uuid: georgeUUID,
  username: 'George',
  password: null,
  avatar: null,
  email: null,
  home: georgeHome,
  library: georgeLib
}, {
  uuid: henryUUID,
  username: 'Henry',
  password: null,
  avatar: null,
  email: null,
  home: henryHome,
  library: henryLib
}, {
  uuid: ianUUID,
  username: 'Ian',
  password: null,
  avatar: null,
  email: null,
  home: ianHome,
  library: ianLib
}, {
  uuid: janeUUID,
  username: 'Jane',
  password: null,
  avatar: null,
  email: null,
  home: janeHome,
  library: janeLib
}, {
  uuid: kateUUID,
  username: 'Kate',
  password: null,
  avatar: null,
  email: null,
  home: kateHome,
  library: kateLib
}, {
  uuid: leoUUID,
  username: 'Leo',
  password: null,
  avatar: null,
  email: null,
  home: leoHome,
  library: leoLib
}, {
  uuid: maryUUID,
  username: 'Mary',
  password: null,
  avatar: null,
  email: null,
  home: maryHome,
  library: maryLib
}, {
  uuid: nicoleUUID,
  username: 'Nicole',
  password: null,
  avatar: null,
  email: null,
  home: nicoleHome,
  library: nicoleLib
}, {
  uuid: oliviaUUID,
  username: 'Olivia',
  password: null,
  avatar: null,
  email: null,
  home: oliviaHome,
  library: oliviaLib
}, {
  uuid: peterUUID,
  username: 'Peter',
  password: null,
  avatar: null,
  email: null,
  home: peterHome,
  library: peterLib
}, {
  uuid: quinnUUID,
  username: 'Quinn',
  password: null,
  avatar: null,
  email: null,
  home: quinnHome,
  library: quinnLib
}, {
  uuid: robbieUUID,
  username: 'Robbie',
  password: null,
  avatar: null,
  email: null,
  home: robbieHome,
  library: robbieLib
}, {
  uuid: sophieUUID,
  username: 'Sophie',
  password: null,
  avatar: null,
  email: null,
  home: sophieHome,
  library: sophieLib
}, {
  uuid: tomUUID,
  username: 'Tom',
  password: null,
  avatar: null,
  email: null,
  home: tomHome,
  library: tomLib
}, {
  uuid: ulyssesUUID,
  username: 'Ulysses',
  password: null,
  avatar: null,
  email: null,
  home: ulyssesHome,
  library: ulyssesLib
}, {
  uuid: vincentUUID,
  username: 'Vincent',
  password: null,
  avatar: null,
  email: null,
  home: vincentHome,
  library: vincentLib
}, {
  uuid: williamUUID,
  username: 'William',
  password: null,
  avatar: null,
  email: null,
  home: williamHome,
  library: williamLib
}, {
  uuid: xenaUUID,
  username: 'Xena',
  password: null,
  avatar: null,
  email: null,
  home: xenaHome,
  library: xenaLib
}, {
  uuid: yvonneUUID,
  username: 'Yvonne',
  password: null,
  avatar: null,
  email: null,
  home: yvonneHome,
  library: yvonneLib
}, {
  uuid: zoeyUUID,
  username: 'Zoey',
  password: null,
  avatar: null,
  email: null,
  home: zoeyHome,
  library: zoeyLib
}];

var drives = [{
  label: 'Alice home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: aliceHome,
  owner: [aliceUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Alice library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: aliceLib,
  owner: [aliceUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Bob home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: bobHome,
  owner: [bobUUID],
  writelist: [],
  readlist: [aliceUUID],
  cache: true
}, {
  label: 'Bob library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: bobLib,
  owner: [bobUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Charlie home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: charlieHome,
  owner: [charlieUUID],
  writelist: [],
  readlist: [aliceUUID, bobUUID],
  cache: true
}, {
  label: 'Charlie library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: charlieLib,
  owner: [charlieUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'David home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: davidHome,
  owner: [davidUUID],
  writelist: [bobUUID],
  readlist: [],
  cache: true
}, {
  label: 'David library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: davidLib,
  owner: [davidUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Emily home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: emilyHome,
  owner: [emilyUUID],
  writelist: [bobUUID],
  readlist: [aliceUUID],
  cache: true
}, {
  label: 'Emily library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: emilyLib,
  owner: [emilyUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Frank home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: frankHome,
  owner: [frankUUID],
  writelist: [bobUUID],
  readlist: [aliceUUID, charlieUUID],
  cache: true
}, {
  label: 'Frank library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: frankLib,
  owner: [frankUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'George home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: georgeHome,
  owner: [georgeUUID],
  writelist: [aliceUUID, bobUUID],
  readlist: [],
  cache: true
}, {
  label: 'George library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: georgeLib,
  owner: [georgeUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Henry home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: henryHome,
  owner: [henryUUID],
  writelist: [aliceUUID, bobUUID],
  readlist: [charlieUUID],
  cache: true
}, {
  label: 'Henry library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: henryLib,
  owner: [henryUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Ian home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: ianHome,
  owner: [ianUUID],
  writelist: [aliceUUID, bobUUID],
  readlist: [charlieUUID, davidUUID],
  cache: true
}, {
  label: 'Ian library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: ianLib,
  owner: [ianUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: '',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: janeHome,
  owner: [janeUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Jane library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: janeLib,
  owner: [janeUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: '@$%$$34445#$^#23',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: kateHome,
  owner: [kateUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Kate library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: kateLib,
  owner: [kateUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Leo home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: leoHome,
  owner: [leoUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Mary library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: maryLib,
  owner: [maryUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Nicole home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: nicoleHome,
  owner: [nicoleUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Nicole library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: nicoleLib,
  owner: [nicoleUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Olivia home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: oliviaHome,
  owner: [oliviaUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Olivia library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: oliviaLib,
  owner: [oliviaUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Peter home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: peterHome,
  owner: [peterUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Peter library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: peterLib,
  owner: [peterUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Quinn home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: quinnHome,
  owner: [quinnUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Quinn library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: quinnLib,
  owner: [quinnUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Robbie home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: robbieHome,
  owner: [robbieUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Robbie library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: robbieLib,
  owner: [robbieUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Sophie home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: sophieHome,
  owner: [sophieUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Sophie library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: sophieLib,
  owner: [sophieUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Tom home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: tomHome,
  owner: [tomUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Tom library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: tomLib,
  owner: [tomUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Ulysses home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: ulyssesHome,
  owner: [ulyssesUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Ulysses library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: ulyssesLib,
  owner: [ulyssesUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Vincent home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: vincentHome,
  owner: [vincentUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Vincent library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: vincentLib,
  owner: [vincentUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'William home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: williamHome,
  owner: [williamUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'William library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: williamLib,
  owner: [williamUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Xena home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: xenaHome,
  owner: [xenaUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Xena library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: xenaLib,
  owner: [xenaUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Yvonne home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: yvonneHome,
  owner: [yvonneUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Yvonne library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: yvonneLib,
  owner: [yvonneUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Zoey home',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: zoeyHome,
  owner: [zoeyUUID],
  writelist: [],
  readlist: [],
  cache: true
}, {
  label: 'Zoey library',
  fixedOwner: true,
  URI: 'fruitmix',
  uuid: zoeyLib,
  owner: [zoeyUUID],
  writelist: [],
  readlist: [],
  cache: true
}];

var genPass = function genPass(text, callback) {
  _bcryptjs2.default.genSalt(10, function (err, salt) {
    if (err) return callback(err);
    _bcryptjs2.default.hash(text, salt, function (err, enc) {
      if (err) return callback(err);
      callback(null, enc);
    });
  });
};

var genPassAsync = _bluebird2.default.promisify(genPass);

var commonPassword = '123456';
var commonEncrypted = '$2a$10$P75ZeC1RQOdR2e.cCEjRgeQmjBMjSJeMPKNC71UoYKbl1OlCsMJNC';

/**
genPassAsync(commonPassword)
  .then(r => {
    console.log(`encrypted version of common password: ${r}`)
  })
  .catch(e => {
    console.log(e)
  })
**/

var getUsers = exports.getUsers = function getUsers() {
  return users.map(function (user) {
    return (0, _assign2.default)((0, _clone2.default)(user), { password: commonEncrypted });
  });
};

// TODO change user to username
var genUserToken = exports.genUserToken = function genUserToken(user) {
  return _jwtSimple2.default.encode({ uuid: user.uuid }, _passportJwt.secret);
};

var initFamilyRoot = exports.initFamilyRoot = function () {
  var _ref = (0, _bluebird.coroutine)(_regenerator2.default.mark(function _callee(rootDir) {
    var driveDir, modelDir, userModel, driveModel;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _async.mkdirpAsync)(rootDir);

          case 2:
            _context.next = 4;
            return _paths2.default.setRootAsync(rootDir);

          case 4:
            driveDir = _paths2.default.get('drives');
            _context.next = 7;
            return _bluebird2.default.all(drives.map(function (drv) {
              return (0, _async.mkdirpAsync)(_path2.default.join(driveDir, drv.uuid));
            }));

          case 7:
            modelDir = _paths2.default.get('models');
            _context.next = 10;
            return _async.fs.writeFileAsync(_path2.default.join(modelDir, 'users.json'), (0, _stringify2.default)(getUsers(), null, '  '));

          case 10:
            _context.next = 12;
            return _async.fs.writeFileAsync(_path2.default.join(modelDir, 'drives.json'), (0, _stringify2.default)(drives, null, '  '));

          case 12:
            _context.next = 14;
            return (0, _userModel.createUserModelAsync)(_path2.default.join(modelDir, 'users.json'));

          case 14:
            userModel = _context.sent;
            _context.next = 17;
            return (0, _driveModel.createDriveModelAsync)(_path2.default.join(modelDir, 'drives.json'));

          case 17:
            driveModel = _context.sent;


            _models2.default.setModel('user', userModel);
            _models2.default.setModel('drive', driveModel);

          case 20:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function initFamilyRoot(_x) {
    return _ref.apply(this, arguments);
  };
}();