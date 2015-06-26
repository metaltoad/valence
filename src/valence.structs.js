'use strict';

/***********************************************************************************************************************************************
 * Identity SYSTEM STRUCTS
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence')
  .service('Valence.Structs', [
    'Structs.Array',
    'Structs.Object',
    'Structs.String',
    'Structs.Number', function(sArray, sObject, sString, sNumber) {
      return {
        Array: sArray,
        Object: sObject,
        String: sString,
        Number: sNumber
      };
  }]);