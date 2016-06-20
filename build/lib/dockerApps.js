'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.APPIFI_KEY = undefined;

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.validateRecipe = validateRecipe;
exports.calcRecipeKey = calcRecipeKey;
exports.calcRecipeKeyString = calcRecipeKeyString;
exports.splitRecipeKeyString = splitRecipeKeyString;
exports.composeJsonLabel = composeJsonLabel;
exports.installAppifiLabel = installAppifiLabel;
exports.uncomposeJsonLabel = uncomposeJsonLabel;
exports.appMainContainer = appMainContainer;
exports.containersToApps = containersToApps;

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _canonicalJson = require('canonical-json');

var _canonicalJson2 = _interopRequireDefault(_canonicalJson);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function textMatch(text) {
  return (/^[A-Za-z][A-Za-z0-9-_+\.]*$/.test(text)
  );
} /*
  
    concepts
  
    1. recipe
    2. container label
  
    container label is a JSON string
  
    container.Labels: {
      "appifi-signature": "...." // container label string 
    }
  
    a container label object format
    {
      uuid: uuid // installation instance
      recipe
    }
  
    recipe format
  
    app, app is a recipe with repo appended onto components
  
    label is a {uuid, recipe} tuple
   */

function validateRecipe(recipe) {

  if (!recipe) return false;

  if (!recipe.appname || !textMatch(recipe.appname)) return false;
  if (!recipe.components || !Array.isArray(recipe.components) || recipe.components.length === 0) return false;

  recipe.components.forEach(function (compo) {
    if (!compo.name || !textMatch(compo.name)) return false;
    if (!compo.namespace || !textMatch(compo.namespace)) return false;
    if (!compo.tag || !textMatch(compo.tag)) return false;
    if (typeof compo.configOverlay !== 'boolean') return false;
    if ((0, _typeof3.default)(compo.config) !== 'object') return false;
    if (typeof compo.repo !== 'null') return false;
  });

  return true;
}

// extract key object from recipe or app object (ducktype)
function calcRecipeKey(recipe) {

  if (recipe.components.length === 0) return null;
  var compo = recipe.components[0];
  var registry = void 0,
      namespace = void 0,
      name = void 0,
      tag = void 0,
      flavor = void 0;

  registry = compo.registry ? compo.registry : 'dockerhub';
  namespace = compo.namespace ? compo.namespace : 'library';
  name = compo.name;
  tag = compo.tag ? compo.tag : 'latest';
  flavor = recipe.flavor ? recipe.flavor : 'vanilla';

  return { registry: registry, namespace: namespace, name: name, tag: tag, flavor: flavor };
}

function calcRecipeKeyString(recipe) {

  var key = calcRecipeKey(recipe);
  if (!key) return null;

  return key.registry + ':' + key.namespace + ':' + key.name + ':' + key.tag + ':' + key.flavor;
}

function splitRecipeKeyString(text) {

  var keys = text.split(':');
  if (keys.length !== 5) return null;

  return {
    registry: keys[0],
    namespace: keys[1],
    name: keys[2],
    tag: keys[3],
    flavor: keys[4]
  };
}

function composeJsonLabel(uuid, recipe) {

  if (!uuid || !_validator2.default.isUUID(uuid)) return null;
  if (!validateRecipe(recipe)) return null;

  var version = '1.0';
  return (0, _canonicalJson2.default)({ version: version, uuid: uuid, recipe: recipe });
}

function installAppifiLabel(labels, uuid, recipe) {

  if (!labels) return;
  labels[APPIFI_KEY] = composeJsonLabel(uuid, recipe);
}

function uncomposeJsonLabel(json) {

  if (typeof json !== 'string') return null;
  if (!_validator2.default.isJSON(json)) return null;

  var sig = JSON.parse(json);
  if (!sig) return null;

  // TODO validate version string

  // ! important validator throws ReferenceError for undefined
  if (!sig.uuid || !_validator2.default.isUUID(sig.uuid)) return null;
  if (!validateRecipe(sig.recipe)) return null;

  return sig;
}

var APPIFI_KEY = exports.APPIFI_KEY = 'appifi-signature';

/**************************************************

  groups: [
    { // group
      uuid: xxxx, // group uuid
      pairs: [
        {
          sig: {
            version: '1.0', // version string
            uuid: xxxx, // uuid
            recipe: {   // a valid recipe
              ...       
            }
          },
          container: xxxx, // reference to container
        },
        ...
      ]
    },
    ...
  ]

*****************************************************/

// group well-labelled container by uuid, using {sig, container} tuple as element
function groupContainersByUUID(containers) {

  var groups = [];
  containers.forEach(function (container) {

    var sig = uncomposeJsonLabel(container.Labels[APPIFI_KEY]);
    if (!sig) return;

    var group = groups.find(function (g) {
      return g.uuid === sig.uuid;
    });
    group ? group.pairs.push({ sig: sig, container: container }) : groups.push({ // create the group and push the first pair
      uuid: sig.uuid,
      pairs: [{ sig: sig, container: container }]
    });
  });

  return groups;
}

function containerMatchComponent(container, component) {
  var name = component.name;
  var namespace = component.namespace;
  var tag = component.tag;

  return container.Image === namespace + '/' + name;
}

function containersMatchComponents(group) {

  var components = group.pairs[0].sig.recipe.components;

  /*  component fields: name, namespace, tag, 
   *  container fields: Image -> "library/busybox"
                        ImageId -> "sha256:47bcc53f7..." TODO
                          --> Image -> Id: ...
                                       RepoTags: ["redis:latest"]
   */
  if (components.length !== group.pairs.length) return false;
  return components.every(function (compo) {
    return group.pairs.find(function (pair) {
      return containerMatchComponent(pair.container, compo);
    });
  });
}

function containerGroupToApp(group) {

  var recipe = group.pairs[0].sig.recipe;
  var recipeKeyString = calcRecipeKeyString(recipe);
  var uuid = group.uuid;
  var sigVersion = group.pairs[0].sig.version;
  var match = group.match;

  var containers = group.pairs.map(function (pair) {
    return pair.container;
  });

  return { recipe: recipe, recipeKeyString: recipeKeyString, uuid: uuid, sigVersion: sigVersion, match: match, containers: containers };
}

function appMainContainer(app) {
  var _app$recipe$component = app.recipe.components[0];
  var name = _app$recipe$component.name;
  var namespace = _app$recipe$component.namespace;
  var tag = _app$recipe$component.tag;

  return app.containers.find(function (c) {
    return c.Image === namespace + '/' + name;
  });
}

function containersToApps(containers) {

  var groups = groupContainersByUUID(containers);
  groups.forEach(function (group) {
    return group.match = containersMatchComponents(group);
  });
  return groups.map(function (group) {
    return containerGroupToApp(group);
  });
}