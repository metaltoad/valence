/***********************************************************************************************************************************************
 * VALENCE ROUTE
 ***********************************************************************************************************************************************
 * @description Route parsing layer.
 */
valenceApp.service('route', ['valence', 'loader', '$rootScope', '$location', '$q', '$routeParams', '$route', function(valence, loader, $rootScope, $location, $q, $routeParams, $route) {

  var hooks = [];

  /**
   * SPLIT AND STRIP
   * 
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  function splitAndStrip(obj) {
    var stripped = [];

    obj = obj.split('/');

    for(var i=0; i<obj.length; i++) {
      if(obj[i] !== "") {
        stripped.push(obj[i]);
      }
    }

    return stripped;
  };

  /**
   * GET ROUTE PARAMS
   * 
   * @return {[type]} [description]
   */
  function getRouteParams() {
    var def = $q.defer(),
        elapsed = 0;

    var paramChecker = setInterval(function() {
      if(Object.keys($routeParams).length) {
        clearInterval(paramChecker);
        def.resolve($routeParams);
      } else {
        elapsed += 300;
        if(elapsed >= 1000) {
          clearInterval(paramChecker)
          def.resolve(null)
        }
      }
    }, 300);

    return def.promise;
  };

  /**
   * PARSE ROUTES
   *
   * @description Analyzes route config to load auth rules and view models, etc.
   * @return {[type]}       [description]
   */
  function parseRoutes(hook) {
    var urlSegs = splitAndStrip($location.path()),
        routeMached = false,
        callbacks,
        routeSegs;

    // Kick off the loader right away
    loader.run();
    
    callbacks = (hook)? [hook] : hooks;

    // Waint until routeParams are available or
    // we can say there aren't any
    getRouteParams().then(function(data) {
      for(var route in $route.routes) {
        var paramCounter = 0, // How many params exist
            paramMatchedCounter = 0, // How many params match
            paramsPassed = false, // Pass fail on params.length vs paramspassed
            uriCounter = 0, // Number of segments in URI
            uriMatchedCounter = 0, // Number of segments that match the actual URL
            urisPassed = false; // If they all matched.

        // Param-less route.
        if(route === $location.path()) {
          // Run hooks.
          callbacks.forEach(function(itm, idx) {
            itm(route, $route.routes);
          });
        } else {
          // Segment routes
          routeSegs = splitAndStrip(route);
          
          // We can say here that if they aren't
          // the same length it is not the $route config we want.
          if(routeSegs.length === urlSegs.length) {
            // If there are actually $routeParams
            if(data) {
              // Begin looping over the route segments.
              for(var i=0; i<routeSegs.length; i++) {
                // If there's a : in the 'when' delcaration
                // we know we need to look for a $routeParam
                if(routeSegs[i].match(':') !== null) {
                  // Loop through $routeParams
                  for(var param in data) {
                    // if this hits, we have params, increment the total number counter
                    paramCounter++;
                    // Check to see if a match
                    if(routeSegs[i].match(param) !== null) {
                      paramMatchedCounter++;
                    }
                  }
                } else {
                  // No param, increment the global URI counter
                  uriCounter++;
                  // Check to see if it matches the .when segment
                  if(routeSegs[i] === urlSegs[i]) {
                    uriMatchedCounter++;
                  }
                }
              }

              // As these are initialized to 0, we need to check their truthyness first
              if(paramCounter && paramMatchedCounter && paramCounter === paramMatchedCounter) {
                paramsPassed = true;
              }

              // Same as above
              if(uriCounter && uriMatchedCounter && uriCounter === uriMatchedCounter) {
                urisPassed = true;
              }

              // We have a match!
              if(paramsPassed && urisPassed && !routeMached) {
                // Angular creates two routes for each app.js entry, one with a trailing /
                // this ensures the hooks will only be executed one per match.
                routeMached = true;
                // run hooks.
                callbacks.forEach(function(itm, idx) {
                  itm(route, $route.routes);
                });
              }
            }
          }
        }
      }
    });
  };


  /**
   * REDIRECT
   *
   * @description Will cause the page to redirect if a matching status code option is found.
   * @param  {[type]} args [description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  valence.route.redirect = function(args, data) {
    var def = $q.defer();
        
    data = data || {};
    
    if(args.opts.HTTP && args.opts.HTTP[args.action] && args.opts.HTTP[args.action].redirect) {
      if(args.data && args.data.status) {
        if(args.opts.HTTP[args.action].redirect[args.data.status]) {
          $location.path(args.opts.HTTP[args.action].redirect[args.data.status]);
          def.resolve({});
        } else {
          def.reject(args);
        }
      }
    } else {
      def.resolve(data);
    }


    return def.promise;
  }

  /**
   * ADD HOOK
   * @param {Function} fn [description]
   * @description Simple API to keep hooks private.
   */
  valence.route.addHook = function(fn) {
    hooks.push(fn);
  };

  valence.route.parseRoutes = parseRoutes;

  //
  // INIT OPTS
  //------------------------------------------------------------------------------------------//

  $rootScope.$on('$locationChangeSuccess', function(evt, absNewUrl, absOldUrl) {

    // Don't save the URL
    valence.route.previous = absOldUrl.split('#')[1];

    // Parse the routes.
    parseRoutes();

  });

  return valence.route;
}]);