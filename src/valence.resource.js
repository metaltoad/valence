'use strict';

/***********************************************************************************************************************************************
 * VALENCE RESOURCE
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence')
  .service('Valence.Resource', ['Valence.Cache', 'Valence.Structs', 'Valence.Events', 'Valence.System', '$http', '$q', function(Cache, Structs, Events, System, $http, $q) {
    
    //
    // CLOSURE NAMESPACE
    //------------------------------------------------------------------------------------------//
    // @description
    var Valence = {};

    //
    // NAMESPACE MEMBERS
    //------------------------------------------------------------------------------------------//
    // @description

    // Struct maps
    Valence.structs = {};
    Valence.structs[Object] = 'Object';
    Valence.structs[Array] = 'Array';
    Valence.structs[String] = 'String';
    Valence.structs[Number] = 'Number';

    //
    // VALENCE RESOURCE
    //------------------------------------------------------------------------------------------//
    // @description
    Valence.Resource = function(name, config) {
      // Resource members
      this.name = name;
      this.defaults = { type: Object, cache: {expires: 60000} };
      this.config = angular.merge(this.defaults, config); // Merge provided with defaults.
      this.data = new Structs[Valence.structs[this.config.type]](); // Create Struct.

      // Expose to System
      Events.publish(Events.definitions.resource.created, this);

      return this;
    };

    //
    // RESOURCE CRUD
    //------------------------------------------------------------------------------------------//
    // @description

    /**
     * GET
     */
    Valence.Resource.prototype.get = function(request) {
      request = request || {};

      return this.read({method: 'GET', url: this.url(this.config.url).segments(request.segments), params: request.params});
    };

    /**
     * PUT
     * @param data
     */
    Valence.Resource.prototype.put = function(request) {
      request = request || {};

      return this.write({url: this.url(this.config.url).segments(request.segments), params: request.params, method: 'PUT', data:data});
    };

    /**
     * POST
     * @param data
     */
    Valence.Resource.prototype.post = function(request) {
      request = request || {};

      return this.write({url: this.url(this.config.url).segments(request.segments), params: request.params, method: 'POST', data:data});
    };

    /**
     * DELETE
     */
    Valence.Resource.prototype.delete = function(request) {
      request = request || {};

      return this.write({url: this.url(this.config.url).segments(request.segments), params: request.params, method: 'DELETE'});
    };

    /**
     * READ
     * @param spec
     * @returns {*}
     */
    Valence.Resource.prototype.read = function(spec) {
      var self = this,
          cache = Cache(spec.url, this.config.cache),
          def = $q.defer();

      cache.get(spec.url).then(function(data) {
        self.data.clean().fill(data);
        def.resolve(data);
      }, function(err) {
        $http(spec).success(function(data) {
          cache.set(spec.url, data).then(function(data) {
            self.data.clean().fill(data);
            def.resolve(data);
          }, function(err) {
            def.reject(err);
          });
        }).error(function(err) {
          def.reject(err);
        });
      });

      return def.promise;
    };

    /**
     * WRITE
     * @param spec
     * @returns {*}
     */
    Valence.Resource.prototype.write = function(spec) {
      var self = this,
        cache = Cache(spec.url, this.config.cache),
        def = $q.defer();

      $http(spec).success(function(data) {
        cache.set(spec.url, data).then(function() {
          self.data.clean().fill(data);
          def.resolve(data);
        }, function(err) {
          def.reject(err);
        });
      }).error(function(error, status, headers, config) {
        def.reject({error: error, status: status, headers: headers, config: config});
      });

      return def.promise;
    };

    //
    // URL FORMATTING
    //------------------------------------------------------------------------------------------//
    // @description
    Valence.Resource.prototype.url = function(url) {
      var re = /^(http|https):\/\//g;

      if(!url) {
        return System.error('No url detected for resource: ' + this.name);
      }

      if(!url.match(re)) {
        return System.error('Url must be a fully qualified path');
      }

      return {
        segments: function(segments) {
          for(var segment in segments) {
            url = url.replace(new RegExp(':'+segment, 'gi'), segments[segment]);
          }

          return url;
        }
      }
    };

    // Resource exposure. ch
    return Valence.Resource;
  }]);