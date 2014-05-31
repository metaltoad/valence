'use strict';

/*******************************************************************************************************
 * VALENCE APP
 *******************************************************************************************************
 * @description Angular app declaration.
 */
var valenceApp = angular.module('valence', []);

// Load the model service right off the bat
valenceApp.run(['route', 'auth', 'acl', 'model', function(route, acl, model) {}])

/**
 * GLOBAL VALENCE
 *
 * @description  Exposing a globalized object like this 
 *               allows for declarative model building
 * @type {Object}
 */
window.valence = {};

//
// MODELS
//------------------------------------------------------------------------------------------//
// @description

/**
 * VAELNCE MODELS
 *
 * @description  This starts out as a globalized container for models that later
 *               gets used in the Provider object.
 * @type {Array}
 */
valence.models = [];

/**
 * VALENCE MODEL
 *
 * @description Model registration.
 * @param  {[type]} model  [description]
 * @param  {[type]} fields [description]
 * @return {[type]}        [description]
 */
valence.model = function(model, fields) {
  var match = false,
      obj = {};

  for(var i=0;i<valence.models.length; i++) {
    if(valence.models[i].name === model) {
      match = true;
    }
  }

  if(!match) {
    obj.name = model;
    for(var prop in fields) {
      obj[prop] = fields[prop];
    }

    valence.models.push(obj);
  }
};


//
// ROLES
//------------------------------------------------------------------------------------------//
// @description
valence.roles = [];

valence.role = function(role, fn) {
  for(var i=0;i<valence.roles.length; i++) {
    if(valence.roles[i].name === role) {
      throw 'Valence - ACL: You cannot register two or more roles with the same name.'
    }
  }

  valence.roles.push({name: role, fn: fn});
};