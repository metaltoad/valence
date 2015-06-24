'use strict';

/***********************************************************************************************************************************************
 * VALENCE MODEL
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence')
  .service('Valence.Model', ['Valence.Resource', 'Valence.Events', function(Resource, Events) {

    //
    // CLOSURE NAMESPACE
    //------------------------------------------------------------------------------------------//
    // @description

    var Valence = {};

    //
    // VALENCE MODEL
    //------------------------------------------------------------------------------------------//
    // @description

    Valence.Model = function(name, opts) {
      this.name = name;
      this.opts = _.merge(this.defaults, opts);
      this.resources = {};
      this.data = {};

      // Dispatch creation
      Events.publish(Events.definitions.model.created, this);

      return this;
    };

    /**
     * Valence Model Defaults.
     * @type {{}}
     */
    Valence.Model.prototype.defaults = {};

    /**
     * Resource
     *
     * Creates a new resource for the Model instance.
     * @param name
     * @param opts
     * @constructor
     */
    Valence.Model.prototype.Resource = function(resource) {
      var self = this;

      if(!(resource instanceof Resource)) {
        throw 'Resource must by of type Valence.Resource, was given: '+ resource;
      }

      return {
        __resource__: resource,
        attach: function() {
          self.resources[resource.name] = this;
          return this;
        },
        detach: function() {
          delete self.resources[resource.name];
          this.unbind();
          return this;
        },
        bind: function() {
          if(!self.resources[resource.name]) {
            self.resources[resource.name] = this;
          }
          self.data[resource.name] = resource.data;
          return this;
        },
        unbind: function() {
          delete self.data[resource.name];
          return this;
        }
      };
    };

    return Valence.Model;
  }]);