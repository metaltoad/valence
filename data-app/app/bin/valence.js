'use strict';

/*******************************************************************************************************
 * VALENCE APP
 *******************************************************************************************************
 * @description Angular app declaration.
 */
var valenceApp = angular.module('valence', ['valenceAuth']);

// Load the model service right off the bat
valenceApp.run(['route', function(route) {}])

/**
 * GLOBAL VALENCE
 *
 * @description  Exposing a globalized object like this 
 *               allows for declarative model building
 * @type {Object}
 */
window.valence = {};

/**
 * VAELNCE MODELS
 *
 * @description  This starts out as a globalized container for models that later
 *               gets used in the Provider object.
 * @type {Array}
 */
valence.models = [];

/**
 * _MODEL
 *
 * @description Valence reserved word that denotes a sertain behavior.
 * 
 * @type {String}
 */
window._model = "model";

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