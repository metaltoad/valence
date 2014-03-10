'use strict';

/*******************************************************************************************************
 * ANGULAR AUTH
 *******************************************************************************************************
 */
var auth = angular.module('valenceAuth', []);

auth.service('auth', ['valenceAuth', '$rootScope', '$location', '$route', '$http', '$routeParams', '$q', function(valenceAuth, $rootScope, $location, $route, $http, $routeParams, $q) {

  var Service;

  // Private 
  var onceAuthedQueue = [];

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
        token = window.localStorage.token;

    // set it immediately to avoid extra http overhead
    $http({method:valenceAuth.endpoints.validate.method, url: valenceAuth.endpoints.validate.URL, withCredentials: true, params: {token: token}}).success(function(data) {

      // Check roles.
      if(route.auth && route.auth.roles) {
        self.validateRoles(route).then(function(roleData) {
          self.postFlow({isValidated: true, setIdentity:data});
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
        self.postFlow({isValidated: true, setIdentity:data});
        // No roles present for this auth
        // run success rediect if present.
        if(redirect && redirect.auth.success) {
          $location.path(redirect.auth.success);
        }
      }
    }).error(function(data) {
      self.postFlow({isValidated: false, setIdentity:null});
      // Auth failed, run fail redirect if present.
      if(redirect && redirect.auth.fail) {
        $location.path(redirect.auth.fail);
      }
    });

    return;
  };

  /**
   * LOGIN
   *
   * @param  {[type]} userData [description]
   * @description valenceAuth's stock login function. Runs off provider config.
   */
  Auth.prototype.login = function(userData) {
    var self = this;
    if(userData) {
      $http({method:valenceAuth.endpoints.login.method, url: valenceAuth.endpoints.login.URL, data:userData}).success(function(data) {
        var token = (data[self.scheme.name])? data[self.scheme.name] : '';
        var identity = (data[self.scheme.identity]);

        self.postFlow({isValidated: true, setToken:token, setIdentity: identity});
        // calling parse routes will simply get the identity set for us.
        self.parseRoutes(true);
        $location.path(valenceAuth.endpoints.create.success);
      }).error(function(data) {
        self.postFlow({isValidated: false, setToken:null});
        $location.path(valenceAuth.endpoints.create.fail);
      });
    } else {
      throw "valenceAuth - you must provide credentials to this method."
    }
  };

  /**
   * LOGOUT
   * 
   * @description valenceAuth's stock logout function. Currently only support token based auth
   */
  Auth.prototype.logout = function() {
    var self = this;
    $http({method:valenceAuth.endpoints.logout.method, url: valenceAuth.endpoints.logout.URL, params: {token:self.getToken()}}).success(function(data, status) {
      if(valenceAuth.endpoints.create.success) {
        self.postFlow({isValidated: false, setToken: null, setIdentity: null});
        $location.path(valenceAuth.endpoints.create.success);
      }
    }).error(function(data) {
      if(valenceAuth.endpoints.create.fail) {
        $location.path(valenceAuth.endpoints.create.fail);
      }
    });
  };

  /**
   * create
   * 
   * @param  {[type]} userData [description]
   * @description Creates a create Auth active identity.
   */
  Auth.prototype.create = function(userData) {
    var self = this;

    if(userData) {
     return $http({method:valenceAuth.endpoints.create.method, url: valenceAuth.endpoints.create.URL, data:userData}).success(function(data, status) {
        if(valenceAuth.endpoints.create.validateOnCreate) {
          self.postFlow({isValidated: true, setToken:data[self.scheme.name], setIdentity: data.user});
        }

        if(valenceAuth.endpoints.create.success) {
          $location.path(valenceAuth.endpoints.create.success);
        }
      }).error(function(data) {
        return data;
      });
    }
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
    console.log('post flow called');
    self.runAuthedQueue(opts.data);

    return;
  };
  
  /**
   * SET TOKEN
   * 
   * @param {[type]} token [description]
   * @description Sets Auth token based on auth scheme
   */
  Auth.prototype.setToken = function(token) {
    if(this.scheme.storage === 'localStorage') {
      window.localStorage[this.scheme.name] = token;
    } else if(this.scheme.storage === 'cookie') {
      // parse cookies, not-written yet.
    } else {
      this.token = token;
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
      token = window.localStorage[this.scheme.name];
    } else if(this.scheme.storage === 'cookie') {
      // parse cookies, not-written yet.
    } else {
      token = this.token;
    }

    return token;
  };

  /**
   * SET IDENTITY
   * 
   * @param {[type]} data User data to save to LS.
   * @description  Saves authenticated user data to LS as an identity reference.
   */
  Auth.prototype.setIdentity = function(data) {
    if(this.scheme.storage === 'localStorage') {
      window.localStorage[this.scheme.identity] = JSON.stringify(data);
    } else if(this.scheme.storage === 'cookie') {
      // parse cookies, not-written yet.
    } else {
      this.identity = data;
    }
  };

  /**
   * GET IDENTITY
   * 
   * @return {Object} Empty object or the parsed localStorage identity object.
   */
  Auth.prototype.getIdentity = function() {
    var identity = null;

    if(this.scheme.storage === 'localStorage') {
      if(!window.localStorage[this.scheme.identity]) {
        window.localStorage[this.scheme.identity] = JSON.stringify({});
      }
      identity = JSON.parse(window.localStorage[this.scheme.identity]);
    } else if(this.scheme.storage === 'cookie') {
      // parse cookies, not-written yet.
    } else {
      identity = this.identity;
    }
    
    return identity;
  };

  /**
   * GET AUTH PARAMS
   * 
   * @description  the purpose of this function is to provide the model layer
   * with whatever tokens/data is needed based on the current auth schema.
   */
  Auth.prototype.getAuthParams = function() {
    var params;

    if(this.scheme.type === 'oAUth') {
      // do something
    }

    if(this.scheme.type === 'token') {
      params = {};
      params[this.scheme.name] = this.getToken();
    }

    return params;
  };

  /**
   * ONCE AUTHED
   * 
   * @param  {Function} fn   [description]
   * @param  {[type]}   opts [description]
   * @description Adds a callback to the callback queue.
   */
  Auth.prototype.onceAuthed = function(fn, opts) {
    onceAuthedQueue.push({fn: fn, opts: opts});
    return;
  };

  /**
   * RUN AUTHED QUEUE
   * 
   * @param  {[type]} data [description]
   * @description Executes items in queue, then removes them.
   * 
   */
  Auth.prototype.runAuthedQueue = function(data) {
    var tmp = [];

    console.log('auth queue called');
    // Loop through queue and run callbacks
    for(var i=0; i<onceAuthedQueue.length; i++) {
      // run cb
      onceAuthedQueue[i].fn(data);
      // If set to only run once, remove from queue.
      if(onceAuthedQueue[i].opts && !onceAuthedQueue[i].opts.runOnce) {
        tmp.push(onceAuthedQueue[i]);
      }
    }

    // Reassign create queue to existing one.
    onceAuthedQueue = tmp;
    return;
  };

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
    console.log('validate roles called: ', route);
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

  /**
   * PARSE ROUTES
   * 
   * @description Parses current route and compares dynamically with $Location to determine the appropriate route object
   *              to pull config data from.
   */
  Auth.prototype.parseRoutes = function(force) {
    var self = this,
        urlSegs = this.splitAndStrip($location.path()),
        routeMached = false,
        routeSegs,
        redirect;

    // This service is called way before the $routeParams object is actually populated.
    // So I've created a promise wrapper for them.
    this.getRouteParams().then(function(data) {
      // Loop through each route param object.
      for(var route in $route.routes) {
        // The system behind these vars is as follows:
        // We need to be able to accommodate any URL fashion with segments and params in any order.
        // to do these we need extensive parsing. We match the param declaration in the route by :,
        // then we match positions of the non-param segments.
        // If they all match with what's in the $routeProvider, we can safely assume we're in the right model and can use its config.
        var paramCounter = 0 ,
            paramMatchedCounter = 0,
            paramsPassed = false,
            uriCounter = 0,
            uriMatchedCounter = 0,
            urisPassed = false;

        
        // Capture routes without params first.
        // Sever execution if the location and route are a straight match.
        if(route === $location.path()) {
          if($route.routes[route].auth || valenceAuth.authEvery || force || self.firstVisit) {
            if($route.routes[route].auth && $route.routes[route].auth.redirect) {
              redirect = $route.routes[route].auth.redirect;
            }
            self.validate($route.routes[route], redirect);
          }
        }
        
        // If not, let the parsing begin!
        // split route declaration in the same fashion as the current URL
        routeSegs = self.splitAndStrip(route);
        
        // We can save cycles here by performing this one-off check.
        // Else these aren't the routes you're looking for.
        if(routeSegs.length === urlSegs.length) {
          // If routeParams actually holds anything.
          if(data) {
            // Loop through with route segments.
            for(var i=0; i<routeSegs.length; i++) {
              if(routeSegs[i].match(':') !== null) {
                // comparae with $routeParams
                for(var param in data) {
                  paramCounter++;
                  // if the param holds the same name
                  if(routeSegs[i].match(param) !== null) {
                    paramMatchedCounter++;
                  }
                }
              } else {
                // Current segment is not a param
                uriCounter++;
                // if the current segment matched the same index of the URL segment.
                if(routeSegs[i] === urlSegs[i]) {
                  uriMatchedCounter++;
                }
              }
            }

            // A note on teh two following blocks:
            // since we capture param-less routes up top, but initialize our counters to zero,
            // we must first cehck to see if they've at least been incremented as well as matched
            // else while 0 is false, 0 === 0 is true.
            
            // Param validator
            if(paramCounter && paramMatchedCounter && paramCounter === paramMatchedCounter) {
              paramsPassed = true;
            }

            // URI validator
            if(uriCounter && uriMatchedCounter && uriCounter === uriMatchedCounter) {
              urisPassed = true;
            }

            // if both validated and the route has been matched only once.
            if(paramsPassed && urisPassed && !routeMached) {
              // Angular creates two routes for each app.js entry, one with a trailing /
              // this ensure it will only be run once.
              routeMached = true;
              if($route.routes[route].auth || valenceAuth.authEvery || force || self.firstVisit) {
                if($route.routes[route].auth && $route.routes[route].auth.redirect) {
                  redirect = $route.routes[route].auth.redirect;
                }
                self.validate($route.routes[route], redirect);
              }
            }
          } else {
            // These are not the routes you are looking for.
          }
        }
      }
      
      // No longer first visit.
      return self.firstVisit = false;
    });
  };

  /**
   * GET PARAMS
   *
   * @description Promise wrapper for $routeParams as they are not usually available when this service is instantiated.
   * @return {Object} Promise object
   */
  Auth.prototype.getRouteParams = function() {
    var def = $q.defer(),
        elapsed = 0;

    var paramChecker = setInterval(function() {
      if(Object.keys($routeParams).length) {
        clearInterval(paramChecker);
        setTimeout(function() {
          def.resolve($routeParams);
        }, 1000 - elapsed)
      } else {
        elapsed += 300;
        // 1000 is totally arbitrary.
        if(elapsed >= 1000) {
          clearInterval(paramChecker);
          def.resolve(null);
        }
      }
    }, 300);

    return def.promise;
  };

  /**
   * SPLIT AND STRIP
   * 
   * @param  {String} obj String to split
   * @return {Array} stripped Array of segments after splitting '/'
   * @description  Make it rain.
   */
  Auth.prototype.splitAndStrip = function(obj) {
    var stripped = [];

    obj = obj.split('/');

    for(var i=0; i<obj.length; i++) {
      if(obj[i] !== "") {
        stripped.push(obj[i]);
      }
    }

    return stripped;
  };

  // There were some runtime issues behind the need for this that I didn't quite understand.
  this.Auth = new Auth();
  // Global reference not bound to 'this'
  Service = this.Auth;

  //
  // ROUTE HOOKS
  //------------------------------------------------------------------------------------------//
  if(valenceAuth.enabled) {
    $rootScope.$on('$routeChangeSuccess', function() {
      Service.parseRoutes();
    });
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
      storage: 'localStorage',
      transmissionMethod: 'query'
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

