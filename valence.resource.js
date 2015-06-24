'use strict';

/***********************************************************************************************************************************************
 * VALENCE RESOURCE
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('System.Valence')
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
      this.config = _.merge({}, this.defaults, config); // Merge provided with defaults.
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

      return this.read({url: this.url(this.config.url).segments(request.segments), params: request.params});
    };

    /**
     * PUT
     * @param data
     */
    Valence.Resource.prototype.put = function(request) {
      request = request || {};

      return this.write({url: this.config.url, method: 'PUT', data:data});
    };

    /**
     * POST
     * @param data
     */
    Valence.Resource.prototype.post = function(request) {
      request = request || {};

      return this.write({url: this.config.url, method: 'POST', data:data});
    };

    /**
     * DELETE
     */
    Valence.Resource.prototype.delete = function(request) {
      request = request || {};

      return this.write({url: this.config.url, method: 'DELETE'});
    };

    /**
     * READ
     * @param spec
     * @returns {*}
     */
    Valence.Resource.prototype.read = function(spec) {
      var self = this;
      var def = $q.defer();

      Cache.get(spec.url).then(function(data) {
        self.data.clean().fill(data);
      }, function(err) {
        $http({method: 'GET', url: spec.url}).success(function(data) {
          Cache.set(spec.url, data).then(function(data) {
            self.data.clean().fill(data);
          });
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
      var self = this;
      var def = $q.defer();

      $http(spec).success(function(data) {
        Cache.set(spec.url, data).then(function(data) {
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
    Valence.Resource.prototype.url = function(url} {
      if(!url) {
        return System.error('No url detected for resource: ' + this.name);
      }

      return {
        segemnts: function(segments) {
          var split = url.split();

          if(!segments) { return url; }


        }
      }
    };

    // Resource exposure.
    return Valence.Resource;
  }]);