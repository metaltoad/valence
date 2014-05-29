'use strict';

/*******************************************************************************************************
 * ANGULAR AUTH
 *******************************************************************************************************
 */
var auth = angular.module('valenceAuth', []);

auth.service('auth', ['valenceAuth', '$rootScope', '$location', '$route', '$http', '$routeParams', '$q', 'route', 
  function(valenceAuth, $rootScope, $location, $route, $http, $routeParams, $q, route) {

  var Service;

  // Private Members
  var currentRoles = [];

  var Auth = function(arg) {
    
    // Total short circuit
    if(valenceAuth.enabled !== false) {
      // Explicitly set to true so that the
      // route hook can work.
      valenceAuth.enabled = true;
    } else {
      // it does === false: short circuit
      return;
    }

    //
    // CONFIG AND ERROR HANDLING
    //------------------------------------------------------------------------------------------//
    // @description ensures the Auth module will have everything it needs.
    if(valenceAuth.endpoints) {
      if(!valenceAuth.endpoints.validate) {
        throw "valenceAuth - The Endpoints config item requires a 'validate' property. This is the property we use to validate an identity's active session."  
      }
      if(!valenceAuth.endpoints.login) {
        throw "valenceAuth - The Endpoints config item requires a 'login' property. This is the property we use to create a user auth identity."  
      }
      if(!valenceAuth.endpoints.logout) {
        throw "valenceAuth - The Endpoints config item requires a 'logout' property. This is the property we use to destroy a user auth identity."  
      }
    } else {
      throw "valenceAuth - No endpoints config found. Make sure in your app's .config() you specify $valenceAuthProvider.endpoints = {}"
    }

    //
    // CLASS MEMBERS
    //------------------------------------------------------------------------------------------//
    this.isValidated = false;

    // Data store.
    this.dataStore = valenceAuth.dataStore;

    // Roles
    this.roles = valenceAuth.roles;

    // The very first time this page is loaded, we want to cehck auth
    this.firstVisit = true;
    
    // Localize auth scheme
    this.scheme = valenceAuth.scheme;

    // If the user specifyies teh token to live only in App memory,
    this.token = null;

    // Validation promise
    this.vPromise = $q.defer();

    return this;
  };

  // Add to prototype for early onset lookups.
  Auth.prototype.scheme = valenceAuth.scheme;

  /**
   * VALIDATE
   * 
   * @description  Session validator
   * @return {[type]} [description]
   */
  Auth.prototype.validate = function(route, redirect) {
    var self = this,
        params = {},
        header = {},
        def = $q.defer(),
        token;



    // Set auth header if it's not there and is in storage
    if(self.getToken() && !$http.defaults.headers.common.Authorization) {
      $http.defaults.headers.common['Authorization'] = 'Bearer ' +self.getToken();
    }

    $http({method:valenceAuth.endpoints.validate.method, url: valenceAuth.endpoints.validate.URL, withCredentials: true}).success(function(data) {

      def.resolve(data);

      // Check roles.
      if(route) {
        if(route.auth && route.auth.roles) {
          self.validateRoles(route).then(function(roleData) {
            self.postFlow({isValidated: true});
            // Role critieria met, run success redirect
            // if present
            if(redirect && redirect.roles.success) {
              $location.path(redirect.roles.success);
            }
          }, function(data) {
            // Role criteria not met, run fail redirect
            // if present.
            if(redirect && redirect.roles.fail) {
              $location.path(redirect.roles.fail); 
            }
          });
        } else {
          self.postFlow({isValidated: true});
          // No roles present for this auth
          // run success rediect if present.
          if(redirect && redirect.auth.success) {
            $location.path(redirect.auth.success);
          }
        }
      }
    
    }).error(function(data) {

      def.reject(data);
      self.postFlow({isValidated: false});
      // Auth failed, run fail redirect if present.
      if(redirect && redirect.auth.fail) {
        $location.path(redirect.auth.fail);
      }
    });

    return def.promise;
  };

  /**
   * LOGIN
   *
   * @param  {[type]} userData [description]
   * @description valenceAuth's stock login function. Runs off provider config.
   */
  Auth.prototype.login = function(userData) {
    var self = this,
        def = $q.defer();;

    if(userData) {
      $http({method:valenceAuth.endpoints.login.method, url: valenceAuth.endpoints.login.URL, data:userData}).success(function(data, status, headers, config) {
        
        var token = (data[self.scheme.name])? data[self.scheme.name] : '';

        var identity = (data[self.scheme.identity]);

        self.postFlow({isValidated: true, setToken:token});
        
        def.resolve(self);

        
      }).error(function(data) {
        self.postFlow({isValidated: false, setToken:null});
        
        def.reject(self);
      });
    } else {
      throw "valenceAuth - you must provide credentials to this method [login]."
    }

    return def.promise;
  };

  /**
   * LOGOUT
   * 
   * @description valenceAuth's stock logout function. Currently only support token based auth
   */
  Auth.prototype.logout = function() {
    var self = this,
        def = $q.defer();

    self.postFlow({isValidated: false, setToken: null});
    $location.path(valenceAuth.endpoints.logout.success);

    def.resolve(self);

    return def.promise;
  };

  /**
   * Handles all of the post Auth opts.
   */
  Auth.prototype.postFlow = function(opts) {
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
   * @description Sets Auth token based on auth scheme
   */
  Auth.prototype.setToken = function(token) {
    var self = this;

    if(this.scheme.storage === 'localStorage') {
      window.localStorage.token = token;
    } else if(this.scheme.storage === 'sessionStorage') {
      window.sessionStorage.token = token;
    }

    if(token) {
      $http.defaults.headers.common['Authorization'] = 'Bearer ' + self.getToken();
    } else {
      delete $http.defaults.headers.common['Authorization'];   
    }
  };

  /**
   * GET TOKEN
   * 
   * @return {[type]} [description]
   * @description Returns the correct token based on auth scheme.
   */
  Auth.prototype.getToken = function() {
    var token = null;

    if(this.scheme.storage === 'localStorage') {
      token = window.localStorage.token;
    } else if(this.scheme.storage === 'sessionStorage') {
      token = window.sessionStorage.token;
    }

    return token;
  };

  // /**
  //  * SET IDENTITY
  //  * 
  //  * @param {[type]} data User data to save to LS.
  //  * @description  Saves authenticated user data to LS as an identity reference.
  //  */
  // Auth.prototype.setIdentity = function(data) {
  //   if(this.scheme.storage === 'localStorage') {
  //     window.localStorage[this.scheme.identity] = JSON.stringify(data);
  //   } else if(this.scheme.storage === 'cookie') {
  //     // parse cookies, not-written yet.
  //   } else {
  //     this.identity = data;
  //   }
  // };

  // *
  //  * GET IDENTITY
  //  * 
  //  * @return {Object} Empty object or the parsed localStorage identity object.
   
  // Auth.prototype.getIdentity = function() {
  //   var identity = null;

  //   if(this.scheme.storage === 'localStorage') {
  //     if(!window.localStorage[this.scheme.identity]) {
  //       window.localStorage[this.scheme.identity] = JSON.stringify({});
  //     }
  //     identity = JSON.parse(window.localStorage[this.scheme.identity]);
  //   } else if(this.scheme.storage === 'cookie') {
  //     // parse cookies, not-written yet.
  //   } else {
  //     identity = this.identity;
  //   }
    
  //   return identity;
  // };

  /**
   * VALIDATE ROLES
   *
   * @description  Every time validate is called, we also check for Role validation.
   *               This will take the order of roles in the array and check them against
   *               what roles have been registered by the user. If found it will execute the provided callback
   *               with the AUth class passed as context, the Promise object and a few Angular services passed as arguments. 
   *               At that point the user is left to decide what that role means. As long as they either resolve or reject the promise,
   *               this will work.
   *                
   * @param  {[type]} route [description]
   * @return {[type]}       [description]
   */
  Auth.prototype.validateRoles = function(route) {
    var def = $q.defer();
    
    if(route && route.auth.roles && route.auth.roles.length) {
      for(var i=0; i<route.auth.roles.length; i++) {
        for(var j=0; j<valenceAuth.roles.length; j++) {
          if(route.auth.roles[i] === valenceAuth.roles[j].role) {
            valenceAuth.roles[j].fn.call(this, def, $routeParams, $route, $location);
          }
        }
      }
    } else {
      def.resolve();
    }

    return def.promise;
  };

  // There were some runtime issues behind the need for this that I didn't quite understand.
  this.Auth = new Auth();
  // Global reference not bound to 'this'
  Service = this.Auth;

  //
  // ROUTE HOOKS
  //------------------------------------------------------------------------------------------//
  function authHook(key, path) {
    
    if(path[key].auth || valenceAuth.authEvery) {

      if(path[key].auth && path[key].auth.redirect) {
        redirect = path[key].auth.redirect;
      }

      Service.validate(path[key], redirect);
    }
  }

  // Add hook if enabled
  if(valenceAuth.enabled) {
    route.addHook(authHook);
  }

  return this.Auth;
}]);

/*********************************************************************************************************************************
 * NG AUTH PROVIDER
 *********************************************************************************************************************************
 *
 * @description Expose the Auth module as a provider so that auth settings can be managed by Angular's config.
 * 
 */
auth.provider('valenceAuth', function() {
  return {
    dataStore: [],
    scheme: {
      type: 'token',
      name: 'token',
      identity: 'user',
      storage: 'localStorage'
    },
    $get: function() {
      this.roles = valenceAuth.roles;
      return this;
    }
  }
});

//
// GLOBAL AUTH API
//------------------------------------------------------------------------------------------//
// @description Role registration has to be done before Angular even has an idea of what Auth
//              is, so we create a global space to to that and then pull it into the class
//              scope later.

/**
 * AUTH
 *
 * @description Place holder object for some minimal global API
 * @type {Object}
 */
window.valenceAuth = {};

/**
 * ROLES
 *
 * @description  Placeholder store for roles registered via valenceAuth.role()
 * @type {Array}
 */
valenceAuth.roles = [];

/**
 * ROLE
 *
 * @description Globalized method to allow role registration before anything has bee loaded by angular.
 * @param  {[type]}   role [description]
 * @param  {Function} fn   [description]
 * @return {[type]}        [description]
 */
valenceAuth.role = function(role, fn) {
  valenceAuth.roles.push({role: role, fn: fn});
};

