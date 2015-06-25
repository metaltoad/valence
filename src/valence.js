'use strict';

/***********************************************************************************************************************************************
 * VALENCE
 ***********************************************************************************************************************************************
 * @description
 */

window.Valence = {Models: {}, Resources: {}, Cache: {}};

angular.module('Valence', [])
  .service('Valence', [
    'Valence.Model', 
    'Valence.Resource', 
    'Valence.Events',
    'Valence.System',
    function(Model, Resource, Events, System) {

      // System
      window.Valence.System = System;

      return {
        Model: Model,
        Resource: Resource,
        Events: Events
      };
    }
  ]).run(['Valence.Events', 'Valence.System', function(Events, System) {

    // Adds new models to the window namespace
    Events.subscribe(Events.definitions.model.created, function(model) {
      window.Valence.Models[model.name] = model;
    });

    // Adds new resources to window namespace
    Events.subscribe(Events.definitions.resource.created, function(resource) {
      window.Valence.Resources[resource.name] = resource;
    });
  }]);