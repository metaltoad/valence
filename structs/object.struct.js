'use strict';

/***********************************************************************************************************************************************
 * Identity SYSTEM STRUCT OBJECT
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('System.Valence')
  .service('Structs.Object', function() {
    var Struct = {};

    Struct.Object = function(name, config) {
      this.data = Object.create(Struct.methods);

      return this.data;
    };

    //
    // OBJECT METHODS
    //------------------------------------------------------------------------------------------//
    // @description
    Struct.methods = {};

    /**
     * Clean
     */
    Struct.methods.clean = function() {
      for (var property in this) {
        delete this[property];
      }

      return this;
    };

    /**
     * Fill
     * @param data
     */
    Struct.methods.fill = function(data) {
      for (var property in data) {
        this[property] = data[property];
      }

      return this;
    };

    return Struct.Object;
  });