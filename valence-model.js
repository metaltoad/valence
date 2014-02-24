// 'use strict';

/***********************************************************************************************************************************************
 * ANGULAR DATA - MODEL
 ***********************************************************************************************************************************************
 * @description On page-load/navigation:
 *
 * 1. analyze the current route, see if route has model property.
 * 2. 
 */
ngDataApp.service('model', ['ngData', 'auth', 'cloud', 'store', 'loader', '$route', '$rootScope', '$location', '$rootElement', '$q', '$routeParams',
  function(ngData, auth, cloud, store, loader, $route, $rootScope, $location, $rootElement, $q, $routeParams) {
    console.log(auth);
  //
  // UTILITY FUNCTIONS
  //------------------------------------------------------------------------------------------//
  
  /**
   * SAFE APPLY
   * @param  {[type]}   scope [description]
   * @param  {Function} fn    [description]
   * @description queues up a $scope.apply
   */
  function safeApply(scope, fn) {
    var self = this;
    var applier = setInterval(function() {
      var phase = scope.$$phase;
      
      if(phase != '$apply' && phase != '$digest') {
        clearInterval(applier);
        scope.$apply(fn);
      }
      console.log('apply timer');
    }, 100);
  };

  /**
   * SPLIT AND STRIP
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
  
  /*********************************************************************************************************************************************
   * MODEL CONSTRUCTOR
   *********************************************************************************************************************************************
   * @description Serves as the service entry point for working with models. At this point it
   *              does nothing more than give us a prototype chain and perform some basic,
   *              global-to-models error handling.
   */
  var Model = function() {
    // do stuff like check if ngModels has anything in it.
    if(!ngData.models.length) {
      throw 'ngData - no models in ngData.models were found. Add a model by using: ngData.model("myModelName", {})';
    }
  };

  //
  // MODEL PROTOTYPE
  //------------------------------------------------------------------------------------------//
  // @contains methods attached to the prototype chain of the Model class.
  Model.fn = Model.prototype = {
    /**
     * ----------
     * GET MODULE
     * ----------
     * @type {Object}
     */
    getter: {
      /**
       * INIT
       * 
       * @param  {[type]} model [description]
       * @param  {[type]} opts  [description]
       * @return {[type]}       [description]
       */
      init: function(model, opts, promise) {
        var self = this,
            belongsTo = false,
            hasMany = false,
            standAlone,
            query;

        if(!opts) {
          opts = self.getModelConfig(model);
        }

        // Force bool
        belongsTo = !!opts.belongsTo;
        hasMany = !!opts.hasMany;
        standAlone = self.isStandAlone(opts);

        if(belongsTo) {
          return this.init(opts.belongsTo.model, null, promise);
        } else {
          // Build query
          query = self.buildParamQuery(opts);

          store.getModel(model, opts, query).then(function(storeGetData) {
            if(hasMany && !standAlone) {
              apply(model, opts, storeGetData);
              self.hasMany(model, opts.hasMany.model, null, promise);
            } else {
              apply(model, opts, storeGetData, promise);
            }
          }, function(storeGetData) {
            console.log(storeGetData);
            cloud.fetchModel(model, opts, query).then(function(cloudGetData) {
              store.setModel(model, cloudGetData).then(function(storeSaveData) {
                if(hasMany && !standAlone) {
                  apply(model, opts, storeSaveData);
                  self.hasMany(model, opts.hasMany.model, null, promise);
                } else {
                  apply(model, opts, storeSaveData, promise);
                }
              }, function(storeSaveData) {
                // Could not save to store, reject promise
              })
            }, function(cloudGetData) {
              // cloud rejected, SOL.
            });
          });
        }
      },
      // The idea here is that has many will always query the
      // data source unless an http object is present and unless the http object is different
      hasMany: function(parentModel, model, opts, promise) {
        var self = this,
            hasMany = false,
            parentOpts = this.getModelConfig(parentModel),
            query;

        if(!opts) {
          opts = this.getModelConfig(model);
        }

        hasMany = !!opts.hasMany;

        query = self.buildParamQuery(opts.belongsTo);

        store.getModel(model, opts, query).then(function(storeGetData) {
          if(hasMany) {
            apply(model, opts, storeGetData);
            self.hasMany(model, opts.hasMany.model, null, promise)
          } else {
            apply(model, opts, storeGetData, promise);
          }
        }, function(storeGetData) {

          // Not is store under store[model];
          // Query the parent model if config isn't specified
          if((opts.HTTP && parentOpts.HTTP && opts.HTTP.GET.url === parentOpts.HTTP.GET.url) 
              || (opts.HTTP && opts.HTTP.GET.url === parentModel) || !opts.HTTP) {
            // Persisten data source is the same, query the parent store by query is query
            store.getModel(parentModel, parentOpts, query).then(function(storeGetFromParentData) {
              console.log(storeGetFromParentData);
              store.setModel(model, storeGetFromParentData).then(function(storeSetFromParentData) {
                if(hasMany) {
                  apply(model, opts, storeSetFromParentData);
                  self.hasMany(model, opts.hasMany.model, null, promise)
                } else {
                  apply(model, opts, storeSetFromParentData, promise);
                }
              }, function(storeGetFromParentData) {
                // throw some error
              });
            }, function(storeGetFromParentData) {
              // We couldn't find what we needed in our parent data so we
              // need to go fetch from das cloud.
              cloud.fetchModel(model, opts, query).then(function(cloudGetData) {
                // Success! Save to store
                store.setModel(model, cloudGetData).then(function(storeSaveData) {
                  if(hasMany) {
                    apply(model, opts, storeSaveData);
                    self.hasMany(model, opts.hasMany.model, null, promise);
                  } else {
                    apply(model, opts, storeSaveData, promise);
                  }
                }, function(storeSaveData) {
                  // Could not save to store, reject promise
                })
              }, function(cloudGetData) {
                // cloud rejected, SOL. throw some error
              });
            });
          } else {
            // child depend is form totally different data store, kick off the retrieval sequence without
            // care of what the parent wants #suchRebel
            store.getModel(model, opts, query).then(function(storeGetData) {
              if(hasMany) {
                apply(model, opts, storeGetData);
                self.hasMany(opts.hasMany.model, null, promise);
              } else {
                apply(model, opts, storeGetData, promise);
              }
            }, function(storeGetData) {
              cloud.fetchModel(model, opts, query).then(function(cloudGetData) {
                store.setModel(model, cloudGetData).then(function(storeSaveData) {
                  if(hasMany) {
                    apply(model, opts, storeSaveData)
                    self.hasMany(opts.hasMany.model, null, promise);
                  } else {
                    apply(model, opts, storeSaveData, promise);
                  }
                }, function(storeSaveData) {
                  // Could not save to store, reject promise
                })
              }, function(cloudGetData) {
                // cloud rejected, SOL.
              });
            });
          }
        });
      },
      /**
       * BUILD PARAM QUERY
       * 
       * @param  {[type]} opts [description]
       * @return {[type]}      [description]
       */
      buildParamQuery: function(opts) {
        var query = {};

        // Returns structured query
        if(opts && opts.by && opts.by.constructor === Object) {
          for(var param in opts.by) {
            if($routeParams[param]) {
              query[opts.by[param]] = $routeParams[param];
            }
          }
        }

        return (Object.keys(query).length)? query : false;
      },
      /**
       * GET MODEL CONFIG
       * 
       * @param  {[type]} model [description]
       * @return {[type]}       [description]
       */
      getModelConfig: function(model) {
        var config;

        for(var i=0; i<ngData.models.length; i++) {
          if(ngData.models[i].name === model) {
            config = ngData.models[i];
          }
        }

        return config;
      },
      /**
       * IS STAND ALONE
       *
       * @description  Determines if the current model needs to parse its child models.
       * @param  {[type]}  opts [description]
       * @return {Boolean}      [description]
       */
      isStandAlone: function(opts) {
        var isStandAlone = false, // Default return
            routeSegs = splitAndStrip($location.path()),
            urlSegs,
            segMatch = 0,
            url = $location.path();

        if(opts.standAlone) {
          if(opts.standAlone.url === url) {
            isStandAlone = true;
          } else {
            urlSegs = splitAndStrip(opts.standAlone);

            if(routeSegs.length === urlSegs.length) {
              for(var i=0; i<routeSegs.length; i++) {
                if(routeSegs[i] === urlSegs[i]) {
                  segMatch++;
                } else {
                  if($routeParams[urlSegs[i].split(':')[1]] && routeSegs[i] === $routeParams[urlSegs[i].split(':')[1]]) {
                    segMatch++;
                  }
                }
              }

              // If we're on teh 
              if(segMatch === routeSegs.length) {
                isStandAlone = true;
              }
            }
          }
        }

        return isStandAlone;
      }
    },
    /**
     * ----------
     * SET MODULE
     * ----------
     * @type {Object}
     */
    setter: {
      init: function(action, model, data, promise) {
        
      }
    }
  };

  /***********************************************************************************************************************************************
   * ANGULAR-DATA - MODEL API
   ***********************************************************************************************************************************************
   * @description Promised based API allows for a manual .get/.set invocation while also
   *              letting view-model data be wired up as normal.
   */
  var API = {};

  /**
   * GET
   * @param  {[type]} model [description]
   * @param  {[type]} opts  [description]
   * @return {[type]}       [description]
   */
  API.get = Model.get = Model.fn.get = function(model, opts) {
    var def = $q.defer();
    
    Model.fn.getter.init(model, opts, def);

    return def.promise;
  };

  /**
   * PUT
   * @param {[type]} model [description]
   * @param {[type]} data  [description]
   */
  API.put = Model.put = Model.fn.set = function(model, data) {
    var def = $q.defer();

    Model.fn.setter.init('PUT', model, data, def)

    return def.promise;
  };

  /**
   * POST
   * @param {[type]} model [description]
   * @param {[type]} data  [description]
   */
  API.post = Model.post = Model.fn.set = function(model, data) {
    var def = $q.defer();

    Model.fn.setter.init('POST', model, data, def);

    return def.promise;
  };

  /**
   * REMOVE
   * @param  {[type]} model [description]
   * @param  {[type]} data  [description]
   * @param  {[type]} def   [description]
   * @return {[type]}       [description]
   * @description  can't use the word delete here because IE8 shits itself.
   */
  API.remove = Model.remove = Model.fn.remove = function(model, data, def) {
    var def = $q.defer();

    Model.fn.remove(model);

    return def.promise;
  };

  // Globalize the API portion.
  window.ngModel = API;;

  //
  // ROOTSCOPE API
  //------------------------------------------------------------------------------------------//
  // @description This API maps to the internal API to allow DOM actions to fire ngData events.
  
  /**
   * POST
   * @type {[type]}
   */
  $rootScope.save = API.post;

  /**
   * PUT
   * @type {[type]}
   */
  $rootScope.update = API.put;

  /**
   * REMOVE
   * @type {[type]}
   */
  $rootScope.remove = API.remove;
  
  /***********************************************************************************************************************************************
   * CORE FUNCTIONS
   ***********************************************************************************************************************************************
   * @description Shared processing function between API.
   */
  
  /**
   * APPLY
   * @param  {[type]} model [description]
   * @param  {[type]} data  [description]
   * @description [description]
   */
  function apply(model, opts, data, promise) {
    var scopes = document.querySelectorAll('.ng-scope'),
        scope, // scope iteration reference
        thisModel, // context model
        fields = opts.fields,
        hasAllProperties = false, // bool for scope detection
        matchCount, // how many to match,
        matchedCount; // mow many have matched

    // Resolves the model's promise at this point.
    // We should'nt need to do scope comparison for this as
    // if model.get() is ever called it should just reflect data returned from that promise.
    if(promise) {
      promise.resolve(data);
      loader.loaded(model);
    }
    
    data = serialize(opts, data);

    // Loop through all the scopes on the DOM.
    for(var i=0; i<scopes.length; i++) {
      // Ignore scopes with ng-repeat attribute
      // this may prove problematic for certain use-cases, but as for now
      // it creates potention for HUGE amounts of wasted cycles.
      if(!scopes[i].hasAttribute('ng-repeat')) {
        scope = angular.element(scopes[i]).scope();
        // here we need to do all of the model analysis
        // determine relationships,
        // and assign scope properties.
        if(scope) {
          if(fields) {
            matchCount = 0;
            matchedCount = 0;
            for(var field in fields) {
              matchCount++;
              if(scope.hasOwnProperty(field)) {
                matchedCount++;
                if(fields[field] === _model) {
                  console.log('just wants the model');
                  // Just assign the entire model back to scope and let the dev decide how to use it.
                  scope[field] = data;
                } else {
                  if(data.constructor === Object) {
                    if(data.hasOwnProperty(field)) {
                      scope[field] = data[field];
                    } else {
                      console.warn('ngData - model property ['+ field +'] does not exist. Cannot assign to scope');
                    }
                  } else {
                    // Further type checking is needed but not sure what to do here atm.
                    scope[field] = data;
                  }
                }
              }
            }
            
            // All model fields matched to fields on the scope,
            // proceed with applying.
            if(matchedCount === matchCount) {
              safeApply(scope);
              loader.loaded(model);
            } else {
              // console.warn('ngData - a model $apply was attempted but none of the provided fields were found in scope [$id: '+scope.$id+'], meaning we do not really know what scope to apply the model to.');
            }
          } else {
            // console.warn('ngData - Make sure your Model declaration has a [fields] property with the field names as keys for items in scope that are to receive model data.');
          }
        }
      }
    }
  };

  /**
   * SERIALIZE
   *
   * @description This function returns a correctly typed set of data based on user
   *              config.
   * @param  {Object} model Compiled model object
   * @param  {Mixed} data Actual javascript data type.
   * @return {Mixed} Serialized data
   */
  function serialize(opts, data) {
    
    var type = Array,
        castMappings = {
          Array: function(data) {
            return [data];
          },
          Object: function(data) {
            console.log('object caster called');
            var obj = {};
            if(data.constructor !== Array) {
              data = [data];
            }

            // If we're converting an array to an objet and
            // the array only has one index, just transfer the object over.
            // Otherwise, create a new property to house each index.
            if(data.length === 1) {
              obj = data[0];
            } else {
              for(var i=0; i<data.length; i++) {
                obj[i] = data[i];
              }
            }
            
            return obj;
          },
          String: function(data) {
            // Not thoroughly flushed out, currently just a 1:1 conversion
            return data.toString();
          },
          Boolean: function(data) {
            // Force Bool;
            return !!data;
          }
        },
        returnData;

    // first and fore most check for type on top-level
    if(opts.type) {
      type = getSerializeType(opts.type)
    } else if(opts.belongsTo && opts.belongsTo.type) {
      type = getSerializeType(opts.belongsTo.type);
    } else {
      type = getSerializeType(type);
    }

    // Now we match what type the data is currently
    if(data.constructor.toString().match(type) === null) {
      // Call the appropriate cast
      if(castMappings[type]) {
        returnData = castMappings[type](data);
      }
    } else {
      // If it's already the appropriate type, then we're GTG.
      returnData = data;
    }
    
    // Return serialized data.
    return returnData;
  };

  /**
   * GET SERIALIZE TYPE
   *
   * @description Compares against a whitelist of types and returns the
   *              string representation of that type so that the casting
   *              can be dynamically called.
   * @param  {[type]} type
   * @return {[type]}
   */
  function getSerializeType(type) {
    var supportedTypes = ['Array', 'String', 'Boolean', 'Object'],
        returnType = false;

    for(var i=0; i<supportedTypes.length; i++) {
      if(type.toString().match(supportedTypes[i])) {
        returnType = supportedTypes[i];
      }
    }

    return returnType;
  };

  //
  // ROUTE HOOKS
  //------------------------------------------------------------------------------------------//

  function loadViewModel(scope) {
    var urlSegs = splitAndStrip($location.path()),
        routeMached = false,
        routeSegs;

    ngData.appliedModels = [];

    // Kick off the loader right away
    loader.run();
    
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
          if($route.routes[route].model) {
            // Force model declaration to array.
            if($route.routes[route].model.constructor !==  Array) {
              $route.routes[route].model = [$route.routes[route].model];
            }
            // Loop through models.
            for(var m=0; m<$route.routes[route].model.length; m++) {
              for(var i=0; i<ngData.models.length; i++) {
                if(ngData.models[i].name === $route.routes[route].model[m]) {
                  // We have a route and model match!
                  Model.get(ngData.models[i].name, ngData.models[i]);
                }
              }
            }
          } else {
            // These aren't the routes you're looking for. #jediCodeTrick
            loader.finish();
            // route matches location but no model found.
            return;
          }
        }

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
              // this ensure it will only be run once.
              routeMached = true;
              // Check to see if a model property exists.
              if($route.routes[route].model) {
                // Force model to array
                if($route.routes[route].model.constructor !==  Array) {
                  $route.routes[route].model = [$route.routes[route].model];
                }
                // Loop through models
                for(var m=0; m<$route.routes[route].model.length; m++) {
                  for(var i=0; i<ngData.models.length; i++) {
                    // Start the process for getting the data!
                    if(ngData.models[i].name === $route.routes[route].model[m]) {
                      Model.get(ngData.models[i].name, ngData.models[i]);
                    }
                  }
                }
              }
            }
          }
        }
      }

      loader.finish();
    });
  };

  //
  // INIT OPTS
  //------------------------------------------------------------------------------------------//

  $rootScope.$on('$locationChangeSuccess', function(data) {
    loadViewModel();
  });

  return new Model();
}]);
