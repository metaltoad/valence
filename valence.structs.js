'use strict';

/***********************************************************************************************************************************************
 * Identity SYSTEM STRUCTS
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('System.Valence')
  .service('Valence.Structs', [
    'Structs.Array',
    'Structs.Object',
    'Structs.String',
    'Structs.Number', function(vArray, vObject, vString, vNumber) {
      return {
        Array: vArray,
        Object: vObject,
        String: vString,
        Number: vNumber
      };
  }]);