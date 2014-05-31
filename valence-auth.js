'use strict';

/*******************************************************************************************************
 * ANGULAR AUTH
 *******************************************************************************************************
 */

valenceApp.service('auth', ['valence', '$rootScope', '$location', '$route', '$http', '$routeParams', '$q', 'route', 
  function(valence, $rootScope, $location, $route, $http, $routeParams, $q, route) {


  //
  // CLASS MEMBERS
  //------------------------------------------------------------------------------------------//
  //
  
  // If true, auth will occur on every view
  valence.auth.every = true;

  // Flag that hold temporary auth status inbetween validations.
  valence.auth.isValidated = null;

  // Timestamp that prevents execessive validation.
  valence.auth.lastValidated = null;

  // How often auth can be checked
  valence.auth.validateInterval = 10000;

  // The very first time valence.auth page is loaded, we want to cehck auth
  valence.auth.firstVisit = true;

  // Token
  valence.auth.token = valence.auth.endpoints.validate.name || null;

  // Storage
  var storage = valence.auth.storage || 'localStorage';

  /**
   * VALIDATE
   * 
   * @description  Session validator
   * @return {[type]} [description]
   */
  valence.auth.validate = function(route, redirect) {
    var self = this,
        params = {},
        header = {},
        def = $q.defer(),
        token;
    
    // Don't allow validation spams by timeboxing.
    if(new Date().getTime() - valence.auth.lastValidated > valence.auth.validateInterval || valence.auth.lastValidated === null) {
      // Set auth header if it's not there and is in storage
      if(self.getToken() && !$http.defaults.headers.common.authorization) {
        $http.defaults.headers.common['authorization'] = 'Bearer ' +self.getToken();
      }

      $http({method:valence.auth.endpoints.validate.method, url: valence.auth.endpoints.validate.URL, withCredentials: true}).success(function(data) {
        
        self.postFlow({isValidated: true, lastValidated: new Date().getTime()});
        
        valence.acl.getIdentity().then(function(identity) {
          def.resolve(identity);
        });
        
        if(route) {
          if(redirect && redirect.success) {
            $location.path(redirect.success);
          } 
        } else {
          // Catches an edge case that misses redirects.
          valence.route.parseRoutes(authHook);
        }
      
      }).error(function(data) {
        
        if(redirect && redirect.fail) {
          $location.path(redirect.fail);
        }

        self.postFlow({isValidated: false, lastValidated: new Date().getTime()});
        
        valence.acl.getIdentity().then(function(identity) {
          def.reject(identity);
        });
      });
    } else {

      if(route) {
        if(valence.auth.isValidated && redirect && redirect.success) {
          $location.path(redirect.success);
        } else if(!valence.auth.isValidated && redirect && redirect.fail) {
          $location.path(redirect.fail);
        }
      } else {
        // Catches an edge case that misses redirects.
        return valence.route.parseRoutes(authHook);
      }

      valence.acl.getIdentity().then(function(identity) {
        def.reject(identity);
      });
    }
    
    return def.promise;
  };

  /**
   * LOGIN
   *
   * @param  {[type]} userData [description]
   * @description valence.auth's stock login function. Runs off provider config.
   */
  valence.auth.login = function(userData) {
    var self = this,
        def = $q.defer();;

    if(userData) {
      $http({method:valence.auth.endpoints.login.method, url: valence.auth.endpoints.login.URL, data:userData}).success(function(data, status, headers, config) {
        
        var token = (data[valence.auth.token])? data[valence.auth.token] : data;

        self.postFlow({isValidated: true, setToken:token});
        
        valence.acl.getIdentity().then(function(identity) {
          def.resolve(identity);
        });

        if(valence.auth.endpoints.login.success) {
          $location.path(valence.auth.endpoints.login.success);
        }
      }).error(function(data) {
        
        self.postFlow({isValidated: false, setToken:null});
        
        valence.acl.getIdentity().then(function(identity) {
          def.resolve(identity);
        });

        if(valence.auth.endpoints.login.fail) {
          $location.path(valence.auth.endpoints.fail);
        }
      });
    } else {
      throw "Valence - Auth - you must provide credentials to this method [login]."
    }

    return def.promise;
  };

  /**
   * LOGOUT
   * 
   * @description valence.auth's stock logout function. Currently only support token based auth
   */
  valence.auth.logout = function() {
    var self = this,
        def = $q.defer();

    self.postFlow({isValidated: false, setToken: null});

    $location.path(valence.auth.endpoints.logout.success);

    valence.acl.clearIdentity().then(function(identity) {
      def.resolve(identity);
    });

    return def.promise;
  };

  /**
   * POST FLOW
   * 
   * @param  {[type]} opts [description]
   * @return {[type]}      [description]
   */
  valence.auth.postFlow = function(opts) {
    var self = this;

    for(var prop in opts) {
      if(self[prop] && self[prop].constructor === Function) {
        self[prop](opts[prop]);
      } else {
        self[prop] = opts[prop];
      }
    }

    return;
  };
  
  /**
   * SET TOKEN
   * 
   * @param {[type]} token [description]
   * @description Sets valence.auth token based on auth scheme
   */
  valence.auth.setToken = function(token) {
    var self = this;

    if(storage === 'localStorage') {
      window.localStorage[valence.auth.token] = token;
    } else if(storage === 'sessionStorage') {
      window.sessionStorage[valence.auth.token] = token;
    }

    if(token) {
      $http.defaults.headers.common['authorization'] = 'Bearer ' + self.getToken();
    } else {
      delete $http.defaults.headers.common['authorization'];   
    }
  };

  /**
   * GET TOKEN
   * 
   * @return {[type]} [description]
   * @description Returns the correct token based on auth scheme.
   */
  valence.auth.getToken = function() {
    var token = null;

    if(storage === 'localStorage') {
      token = window.localStorage[valence.auth.token];
    } else if(storage === 'sessionStorage') {
      token = window.sessionStorage[valence.auth.token];
    }

    return token;
  };

  // Total short circuit
  if(valence.auth.enabled !== false) {
    // Explicitly set to true so that the
    // route hook can work.
    valence.auth.enabled = true;
  } else {
    // it does === false: short circuit
    return;
  }

  //
  // CONFIG AND ERROR HANDLING
  //------------------------------------------------------------------------------------------//
  // @description ensures the valence.auth module will have everything it needs.
  if(valence.auth.endpoints) {
    if(!valence.auth.endpoints.validate) {
      throw "Valence - valence.auth: The Endpoints config item requires a 'validate' property. This is the property we use to validate an identity's active session."  
    }
    if(!valence.auth.endpoints.login) {
      throw "Valence - valence.auth: The Endpoints config item requires a 'login' property. This is the property we use to create a user auth identity."  
    }
    if(!valence.auth.endpoints.logout) {
      throw "Valence - valence.auth: The Endpoints config item requires a 'logout' property. This is the property we use to destroy a user auth identity."  
    }
  } else {
    throw "Valence - valence.auth: No endpoints config found. Make sure in your app's .config() you specify $valence.authProvider.endpoints = {}"
  }

  //
  // ROUTE HOOK
  //------------------------------------------------------------------------------------------//
  function authHook(key, path) {
    var redirect;
    
    if(path[key].auth || valence.auth.every) {

      if(path[key].auth && path[key].auth.redirect) {
        redirect = path[key].auth.redirect;
      }

      valence.auth.validate(path[key], redirect);
    }
  }

  // Add hook if enabled
  if(valence.auth.enabled) {
    valence.route.addHook(authHook);
  }

  return valence;
}]);