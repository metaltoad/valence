/***********************************************************************************************************************************************
 * VALENCE ACCESS CONTROL
 ***********************************************************************************************************************************************
 * @description Access control layer.
 */
valenceApp.service('acl', ['valence', 'route', 'model', '$q', '$location', function(valence, route, model, $q, $location) {

  //
  // IDENTITY MANAGEMENT
  //------------------------------------------------------------------------------------------//
  //
  
  // Dictates what identity to use
  var identity = valence.acl.identity.model || null;

  // Fallback
  var guest = valence.acl.identity.default || {name: 'Anonymous', role: 'guest'};

  /**
   * GET IDENTITY
   *
   * @description Resolves the identity model or fallback identity.
   * @return promise
   */
  valence.acl.getIdentity = function() {
    var def = $q.defer();
    
    if(!identity) {
      def.resolve(guest);
    } else {
      model.get(identity).then(function(data) {
        def.resolve(data);
      }, function(data) {
        def.resolve(guest)
      });
    }

    return def.promise;
  };

  /**
   * CLEAR IDENTITY
   *
   * @description Removes identity of the store.
   * @return {[type]} [description]
   */
  valence.acl.clearIdentity = function() {
    var def = $q.defer();

    valence.store.remove({model:identity}).then(function(data) {
      def.resolve(guest);
    }, function(data) {
      def.reject(data);
    });

    return def.promise;
  }

  //
  // ACCESS CONTROL
  //------------------------------------------------------------------------------------------//
  // @description determines viewability of content against the current user.

  /**
   * HAS ACCESS
   * @param  {[type]}  roles [description]
   * @param  {[type]}  rules [description]
   * @return {Boolean}       [description]
   */
  valence.acl.checkRoles = function(roles, rules) {
      var role,
        hasAccess = false,
        currRole = 0;
        
    (function checkRole() {
      if(roles[currRole]) {
        
        role = getRole(roles[currRole]);

        role.fn(valence, $q).then(function(rolePass) {
          hasAccess = true;
        }, function(rolePass) {
          currRole++;
          return checkRole();
        });
      } else {
        if(currRole === roles.length && !hasAccess) {
          if(rules.redirect && rules.redirect.fail) {
            if(rules.redirect.fail === 'previous') {
              if($location.path() === valence.route.previous) {
                return $location.path('/');
              } else {
                return $location.path(valence.route.previous);
              }
            } else {
              return $location.path(rules.redirect.fail);
            }
          }
          return;
        }
      }
    })();

    return;
  };

  /**
   * GET ROLE
   *
   * @description Gets valence config data from valence.roles
   * @param  {[type]} role [description]
   * @return {[type]}      [description]
   */
  function getRole(role) {
    for(var i=0; i<valence.roles.length; i++) {
      if(valence.roles[i].name == role) {
        return valence.roles[i];
      }
    }
  };

  /**
   * ACCESS HOOK
   *
   * @description This gets executed on every locationChangeSuccess
   * @param  {[type]} key  [description]
   * @param  {[type]} path [description]
   * @return {[type]}      [description]
   */
  valence.acl.accessHook = function(key, path) {
    if(path[key].access && path[key].access.roles) {
      // Convert to array if needed.
      if(path[key].access.roles.constructor !== Array) {
        path[key].access.roles = [path[key].access.roles]
      }

      valence.acl.checkRoles(path[key].access.roles, path[key].access);
    }
  };

  // Register route hook.
  valence.route.addHook(valence.acl.accessHook);

  return valence;
}]);