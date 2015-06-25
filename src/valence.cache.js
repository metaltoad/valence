'use strict';

/***********************************************************************************************************************************************
 * VALENCE CACHE
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence')
  .service('Valence.Cache', ['$q', function($q) {
    var Valence = {}, Cache = {};

    Valence.Cache = function (name, opts) {
      opts = opts || {};

      this.name = name;
      this.added = Date.now();
      this.updated = Date.now();
      this.defaults = {expires: 0};
      this.config = angular.extend(this.defaults, opts);
      this.data;

      return this;
    };

    function get(url) {
      var cache = Cache[url],
          def = $q.defer();

      if(cache && cache.data && (Date.now() - cache.updated < cache.config.expires)) {
        def.resolve(cache.data);
      } else {
        def.reject('Cache Expired');
      }

      return def.promise;
    }

    function set(url, data) {
      var cache = Cache[url],
          def = $q.defer();

      if(cache) {
        cache.data = data;
        cache.updated = Date.now();
        def.resolve(cache.data);
      } else {
        def.reject('Could not locate cache');
      }

      return def.promise;
    }

    return function(url, opts) {

      if(!Cache[url]) {
        Cache[url] = new Valence.Cache(url, opts);
      }

      return {
        get: get,
        set: set
      };
    }
  }]);