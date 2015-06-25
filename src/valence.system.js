'use strict';

/***********************************************************************************************************************************************
 * VALENCE - System 
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence')
  .service('Valence.System', [function() {
    var levels = {};
        levels['1'] = 'off';
        levels['2'] = 'quiet';
        levels['3'] = 'chatty';
        levels['4'] = 'verbose';

    var level = 1;

    var reporter = {};
        reporter.prefix = 'Valence - ';
    var System = {
      log: log,
      warn: warn,
      error: error,
      level: {
        get:getLevel,
        set:setLevel
      }
    };

    return System;

    function log() {

    }

    function warn() {

    }

    function error(err) {
      throw reporter.prefix + error;
    }

    function getLevel() {

    }

    function setLevel() {

    }
  }]);