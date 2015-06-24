'use strict';

/***********************************************************************************************************************************************
 * VALENCE CACHE
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('System.Valence')
  .service('Valence.Cache', ['$q', function($q) {

    //
    // CACHE NAMESPACE
    //------------------------------------------------------------------------------------------//
    // @description
    var Cache = window.Valence.Cache = {__cache__: {}};

    //
    // CACHE VALIDATION
    //------------------------------------------------------------------------------------------//
    // @description
    Cache.validate = function(cache) {
      var def = $q.defer();
      var failed = [];

      if(cache && cache.data) {
        for(var option in cache.config) {
          var validator = Cache.validators[option];

          if(validator) {
            if(!validator(cache)) {
              failed.push(validator.error)(cache);
            }
          }
        }

        if(failed.length) {
          def.reject(failed);
        } else {
          def.resolve();
        }
      } else {
        def.reject(Cache.validators.empty);
      }

      return def.promise;
    };

    Cache.validators = {};

    Cache.validators.empty = 'Requested cache not found';

    Cache.validators.expires = function(cache) {
      return (Date.now() - (cache.__meta__.updated || cache.__meta__.added) >= cache.config.expires);
    };

    Cache.validators.expires.error = function(cache) { return 'Cache for: '+ cache.name +' is stale. Please refresh.'; };

    Cache.defaults = {
      expires: 0
    };

    //
    // CACHE CRUD
    //------------------------------------------------------------------------------------------//
    // @description
    Cache.add = function(url, config) {
      this.__cache__[url] = {__meta__: {added: Date.now()}, config: _.merge(Cache.defaults, config), name: url};
    };

    Cache.remove = function(url, config) {
      delete this.__cache__[url];
    };

    /**
     * Get
     * @param url
     * @returns {*}
     */
    Cache.get = function(url) {
      var def = $q.defer();
      var cache = this.__cache__[url];

      this.validate(cache).then(function() {
        def.resolve(cache.data);
      }, function(err) {
        def.reject(err);
      });

      return def.promise;
    };

    Cache.set = function(url, data) {
      var def = $q.defer();
      var cache = this.__cache__[url];

      if(cache) {
        // Set data
        cache.data = data;
        // Set updated
        cache.__meta__.updated = Date.now();
        // Resolve data;
        def.resolve(cache.data);
      } else {
        def.reject('Cache not found');
      }

      return def.promise;
    };

    return Cache;
  }]);