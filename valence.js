'use strict';

/***********************************************************************************************************************************************
 * VALENCE
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence', [])
  .service('Valence', [
    'Valence.Model', 
    'Valence.Resource', 
    'Valence.Events',
    'Valence.System',
    function(Model, Resource, Events, System) {
      // Window namespace
      window.Valence = {Models: {}, Resources: {}, Cache: {}, System: System};

      return {
        Model: Model,
        Resource: Resource,
        Events: Events
      };
    }
  ]).run(['Valence.Events', function(Events) {

    // Adds new models to the window namespace
    Events.subscribe(Events.definitions.model.created, function(model) {
      window.Valence.Models[model.name] = model;
    });

    // Adds new resources to window namespace
    Events.subscribe(Events.definitions.resource.created, function(resource) {
      window.Valence.Resources[resource.name] = resource;
    });
  }]);