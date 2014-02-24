'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - ANGULAR DATA MODULES - CLOUD
 *******************************************************************************************************
 */
ngDataApp.service('cloud', ['ngData', '$http', '$q', function(ngData, $http, $q) {
  
  var baseEarl = ngData.api + '/';

  function fetchModel(model, opts, query) {
    var def = $q.defer(),
        httpOpts = {};

    // Defaults
    httpOpts.method = 'GET';
    httpOpts.url = baseEarl+model;
    httpOpts.params = null;

    // Build url
    if(opts.HTTP && opts.HTTP.GET && opts.HTTP.GET.url) {
      httpOpts.url = baseEarl+opts.HTTP.GET.url;
    }

    // Build Params
    if(query) {
      httpOpts.params = query;
    }

    // Make request - I know $http returns a promise
    // I prefer keeping things consistent
    $http(httpOpts).success(function(data) {
      def.resolve(data)
    }).error(function(data) {
      def.reject(data);
    });

    return def.promise;
  };

  function saveModel(opts) {

    opts.url = url+opts.url;
    
    return $http(opts).success(function(data) {
      return data;
    }).error(function(data) {
      return data;
    });
  };

  return {
    fetchModel: fetchModel,
    saveModel: saveModel
  };
}]);
