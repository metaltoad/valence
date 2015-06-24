'use strict';

/***********************************************************************************************************************************************
 * Identity SYSTEM STRUCT STRING
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('System.Valence')
  .service('Structs.String', function() {
    var Struct = {};

    Struct.String = function() {
      this.string = '';

      return this;
    };

    Struct.String.prototype.clean = function() {this.string = ''; return this;};
    Struct.String.prototype.fill = function(data) {this.string = data; return this;};

    return Struct.String;
  });