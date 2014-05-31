'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - ANGULAR DATA MODULES - CLOUD
 *******************************************************************************************************
 */
valenceApp.service('cloud', ['valence', '$http', '$q', function(valence, $http, $q) {
  
  // Base api definition
  var baseEarl = valence.api + '/';

  /**
   * GET
   *
   * @description HTTP RETRIEVAL
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  valence.cloud.get = function(args) {
    var def = $q.defer(),
        token,
        predicates,
        httpOpts = {};
        
    // Defaults
    httpOpts.method = 'GET';
    httpOpts.url = baseEarl+args.model;
    httpOpts.params = null;

    // Build request data.
    if(args.opts.HTTP && args.opts.HTTP.GET) {
      
      // Detect query
      if(args.opts.HTTP.GET.params) {
        args.query = valence.buildParamQuery(args.opts.HTTP.GET);
      } else if(args.opts.belongsTo) {
        args.query = valence.buildParamQuery(args.opts.belongsTo);
      }
      
      // Build URL
      if(args.opts.HTTP.GET.url) {
        httpOpts.url = baseEarl+args.opts.HTTP.GET.url
      }

      // Will need to make sure that the validation endpoint hits before
      if(args.opts.HTTP.GET.auth && !valence.auth.isValidated) {
        def.reject();
      }
    } else {
      if(args.opts.belongsTo) {
        args.query = valence.buildParamQuery(args.opts.belongsTo);
      }
    }

    // Build Params
    if(args.query) { httpOpts.params = args.query.params || args.query.by}

    // Make request - I know $http returns a promise
    // I prefer keeping things consistent
    $http(httpOpts).success(function(data) {
      def.resolve(data)
    }).error(function(data, status, headers, config) {
      def.reject({data: data, status: status, headers: headers, config: config});
    });

    return def.promise;
  };

  /**
   * SET
   *
   * @description  HTTP Persistance
   * @return {[type]}
   */
  valence.cloud.set = function(args) {
    var def = $q.defer(),
        token,
        action,
        httpOpts = {};

    action = args.action.toUpperCase();

    httpOpts.method = action;
    httpOpts.url = baseEarl+args.model;
    httpOpts.params = null;
    
    if(args.opts.HTTP && args.opts.HTTP[action]) {

      // Detect query
      args.query = valence.buildParamQuery(args.opts.HTTP[action]);

      if(args.opts.HTTP[action].url) {
        httpOpts.url = baseEarl+args.opts.HTTP[action].url;
      }
    }

    // Build Params
    if(args.query && args.query.params) { httpOpts.params = args.query.params};

    // Message body
    httpOpts.data = args.data;

    // Add any config declared data
    if(args.query && args.query.data) {
      for(var key in args.query.data) {
        httpOpts.data[key] = args.query.data[key];
      }
    }
    
    // Send request
    $http(httpOpts).success(function(data) {
      def.resolve(data);
    }).error(function(data, status, headers, config) {
      def.reject({data: data, status: status, headers: headers, config: config});
    });

    return def.promise;
  };

  return valence.cloud;
}]);
