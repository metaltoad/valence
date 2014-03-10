'use strict';

/*******************************************************************************************************
 * VALENCE APP
 *******************************************************************************************************
 * @description Angular app declaration.
 */
var valenceApp = angular.module('valence', ['valenceAuth']);

// Load the model service right off the bat
valenceApp.run(['model', function(model) {}])

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


/**
 * _MODEL
 *
 * @description API helper when using view models. For example
 *              if the user just wants to assign the entirety of the
 *              products model to $scope.products they would just say:
 *              fields: {products:_model}
 * @type {String}
 */
window._model = '_model';