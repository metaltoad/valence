// 'use strict';

/***********************************************************************************************************************************************
 * VALENCE - MODEL
 ***********************************************************************************************************************************************
 * @description On page-load/navigation:
 *
 * @REFACTOR  (yeah I make my own doc tags so what)
 *            The goal here is to refactor the model core in a way the utilizes the strategy pattern
 *            and a queueing system for requests. The core challenge here will be relationship parsing.
 *            The current model uses recursion to find a model's parent if present. Once found it then
 *            parses child models. The problem with this model is when a model needs to be fetched that is standalone
 *            in its data needs it proceeds to fetch child models even though they are irrelevant in that
 *            specific view.
 *
 *            Right now, relationships are parsed but models are stored separately. Which doens't really make sense.
 *            If relationships are parsed then objects should be mutated to be the tree that matches the whole data set.
 *            The challenge here is modeling the data to be easily parseable: 
 *
 *              The comments model belongs to the post model which belongs to the posts model.
 *              The issue with constructing trees like that are: post isn't actually a thing it is an object that is in
 *              an index of the posts array, while comments can actually be an injected property within the post object.
 *              Since both are specified as belongsTo, how do you diffrentiate objects that don't have explicit naming?
 *
 *              The alternative, or another option is to not let lists be a 'thing' that you can fetch, but rather extend the
 *              thing, like 'post' to say: model.get('post').all(); to indicate, that this thing can be a part of a list.
 *              Then maybe for child objects that could also tehcnically be a list: model.get('post').comments();
 *
 *            The other option is to ignore predetermined relatioships by doing an 'on demand' system as opposed to relational binding
 *            that simply pulls in another model when asked for and assigns that model's data to the corresponding fields on the scope.
 *            This complicates though when loading models by data via another model when not explicitly called. This was solved by the original
 *            'URL driven' approach that used by: {route_param: data_field}. That approach is limiting in that you can't make custom queries
 *            without using $routeParams. URL driven turned into URL coupled. The above delimma really only applies to 'view models' as on load it's extremely
 *            easy to call .get() on the fly.
 *
 *            The on-demand system however begs the question: 'why even bother formalizing the notion of a view model in angular!??' 
 *
 *            It seems as though Ember is successful with treating all models this way because the view loading hierarchy has been engineered for this purpose.
 *            
 */
valenceApp.service('model', ['valence', 'cloud', 'store', 'loader', 'auth', '$route', '$rootScope', '$location', '$rootElement', '$q', '$routeParams', 'route',
  function(valence, cloud, store, loader, auth, $route, $rootScope, $location, $rootElement, $q, $routeParams, route) {

  //
  // UTILITY FUNCTIONS
  //------------------------------------------------------------------------------------------//
  
  /**
   * SAFE APPLY
   * 
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
  
  /*********************************************************************************************************************************************
   * MODEL CONSTRUCTOR
   *********************************************************************************************************************************************
   * @description Serves as the service entry point for working with models. At this point it
   *              does nothing more than give us a prototype chain and perform some basic,
   *              global-to-models error handling.
   *
   * @TODO Actually architect this thing instead of all this procedural bullshit.
   */
  var Model = function() {
    // do stuff like check if ngModels has anything in it.
    if(!valence.models.length) {
      throw 'valence - no models in valence.models were found. Add a model by using: valence.model("myModelName", {})';
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
            serializePromise = $q.defer(),
            query;

        
        opts = Model.fn.getModelConfig(model, opts);

        // Force bool
        belongsTo = !!opts.belongsTo;
        hasMany = !!opts.hasMany;
       
        // Determine if stand alone model.
        standAlone = self.isStandAlone(opts);

        if(belongsTo) {
          return this.init(opts.belongsTo.model, null, promise);
        } else {
          // Build query
          if(opts.HTTP && opts.HTTP.GET) {
            query = Model.fn.buildParamQuery(opts.HTTP.GET);
          } else {
            query = Model.fn.buildParamQuery(opts);
          }

          // First pass at getting from store.
          store.getModel(model, opts, query).then(function(storeGetData) {
            if(hasMany && !standAlone) {
              // loader.loaded(model);
              apply(model, opts, storeGetData);
              self.hasMany(model, opts.hasMany.model, null, promise);
            } else {
              apply(model, opts, storeGetData, promise);
            }
          }, function(storeGetData) {
            console.log(model);
            // Data not found in store, query cloud
            cloud.fetchModel(model, opts, query).then(function(cloudGetData) {
              // Save to store.
              // TODO make sure to do this wherever store.getModel is called
              if(opts.serializer) {
                opts.serializer(cloudGetData, serializePromise).then(function(serializeData) {
                  store.setModel(model, serializeData, opts).then(function(storeSaveData) {
                    if(hasMany && !standAlone) {
                      // loader.loaded(model);
                      apply(model, opts, storeSaveData);
                      self.hasMany(model, opts.hasMany.model, null, promise);
                    } else {
                      apply(model, opts, storeSaveData, promise);
                    }
                  }, function(storeSaveData) {
                    // Could not save to store, promise rejected
                    // 
                  })
                });
              } else {
                store.setModel(model, cloudGetData, opts).then(function(storeSaveData) {
                  if(hasMany && !standAlone) {
                    // loader.loaded(model);
                    apply(model, opts, storeSaveData);
                    self.hasMany(model, opts.hasMany.model, null, promise);
                  } else {
                    apply(model, opts, storeSaveData, promise);
                  }
                }, function(storeSaveData) {
                  // Could not save to store, reject promise
                })
              }
            }, function(cloudGetData) {
              // cloud rejected, SOL.
            });
          });
        }
      },
      /**
       * HAS MANY
       * 
       * @param  {[type]}  parentModel [description]
       * @param  {[type]}  model       [description]
       * @param  {[type]}  opts        [description]
       * @param  {[type]}  promise     [description]
       * @return {Boolean}             [description]
       */
      hasMany: function(parentModel, model, opts, promise) {
        var self = this,
            hasMany = false,
            parentOpts = Model.fn.getModelConfig(parentModel),
            query;

        if(!opts) {
          opts = Model.fn.getModelConfig(model);
        }

        hasMany = !!opts.hasMany;

        query = Model.fn.buildParamQuery(opts.belongsTo);

        store.getModel(model, opts, query).then(function(storeGetData) {
          if(hasMany) {
            apply(model, opts, storeGetData);
            self.hasMany(model, opts.hasMany.model, null, promise)
          } else {
            apply(model, opts, storeGetData, promise);
          }
        }, function(storeGetData) {
          // Query the parent model if config isn't specified
          if((opts.HTTP && parentOpts.HTTP && opts.HTTP.GET && parentOpts.HTTP.GET && opts.HTTP.GET.url === parentOpts.HTTP.GET.url) 
              || (opts.HTTP && opts.HTTP.GET.url === parentModel) || !opts.HTTP) {
            // Persistent data source is the same, query the parent store by query is query
            store.getModel(parentModel, parentOpts, query).then(function(storeGetFromParentData) {
              // TODO: TEST hasMany SERIALIZATION
              // if(opts.serializer) {storeGetFromParentData = opts.serializer(cloudGetData)}
              // Now save that data to the store.
              store.setModel(model, storeGetFromParentData, opts).then(function(storeSetFromParentData) {
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
                if(opts.serializer) {cloudGetData = opts.serializer(cloudGetData);}
                // Success! Save to store
                store.setModel(model, cloudGetData, opts).then(function(storeSaveData) {
                  if(hasMany) {
                    apply(model, opts, storeSaveData);
                    self.hasMany(model, opts.hasMany.model, null, promise);
                  } else {
                    apply(model, opts, storeSaveData, promise);
                  }
                }, function(storeSaveData) {
                  // Could not save to store, reject promise
                  promise.reject(storeSaveData);
                })
              }, function(cloudGetData) {
                // cloud rejected, SOL. throw some error
                promise.reject(cloudGetData);
              });
            });
          } else {
            // child depend is fromm totally different data store, kick off the retrieval sequence without
            // care of what the parent wants #suchRebel
            store.getModel(model, opts, query).then(function(storeGetData) {
              if(hasMany) {
                apply(model, opts, storeGetData);
                self.hasMany(opts.hasMany.model, null, promise);
              } else {
                apply(model, opts, storeGetData, promise);
              }
            }, function(storeGetData) {
              // 
              cloud.fetchModel(model, opts, query).then(function(cloudGetData) {
                // Serialize
                if(opts.serializer) {cloudGetData = opts.serializer(cloudGetData)}
                // Save to store
                store.setModel(model, cloudGetData, opts).then(function(storeSaveData) {
                  if(hasMany) {
                    apply(model, opts, storeSaveData)
                    self.hasMany(opts.hasMany.model, null, promise);
                  } else {
                    apply(model, opts, storeSaveData, promise);
                  }
                }, function(storeSaveData) {
                  // Could not save to store, reject promise
                  promise.reject(storeSaveData);
                })
              }, function(cloudGetData) {
                // cloud rejected, SOL.
                promise.reject(cloudGetData);
              });
            });
          }
        });
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
        var self = this,
            opts = Model.fn.getModelConfig(model),
            hasMany,
            query;

        // Start the loader
        loader.run(model, opts);

        // If it has child models.
        hasMany = !!(opts.hasMany && opts.hasMany.model);

        query = Model.fn.buildParamQuery(opts.HTTP[action.toUpperCase()]);

        cloud.saveModel(model, action, opts, query, data).then(function(cloudSaveData) {
          console.log(cloudSaveData);
          // now call get on the whole thing
          cloud.fetchModel(model, opts, Model.fn.buildParamQuery(opts.HTTP.GET)).then(function(cloudGetData) {
            store.setModel(model, cloudGetData).then(function(storeSaveData) {
              if(hasMany && Model.fn.getModelConfig(opts.hasMany.model).belongsTo.model === model) {
                store.deleteModel(opts.hasMany.model).then(function() {
                  apply(model, opts, storeSaveData, promise);
                });
              } else {
                apply(model, opts, storeSaveData, promise);
              }
            }, function(storeSaveData) {
              // if we can't save to store
              promise.reject(storeSaveData);
              loader.loaded(model);
            });
            }, function(cloudGetData) {

          });
        }, function(cloudSaveData) {
          // cloud save failed
          promise.reject(cloudSaveData);
          loader.loaded(model);
        });
      }
    },
    /**
     * GET MODEL CONFIG
     * 
     * @param  {[type]} model [description]
     * @return {[type]}       [description]
     */
    getModelConfig: function(model, opts) {
      var config;

      for(var i=0; i<valence.models.length; i++) {
        if(valence.models[i].name === model) {
          config = valence.models[i];
        }
      }

      if(!config && opts) {
        return config = opts;
      } else if(!config && !opts) {
        throw 'Valence - model for ['+model+'] not found. Make sure to declare one through valence.model()';
      }

      (opts)? config = Model.fn.merge(config, opts) : '';

      return config;
    },
    /**
     * BUILD PARAM QUERY
     * 
     * @param  {[type]} opts [description]
     * @return {[type]}      [description]
     */
    buildParamQuery: function(opts) {
      var query = {},
          predicate;
          
      if(opts) {
        if(opts.by) {
          predicate = ['by'];
        } else if(opts.params && !opts.data) {
          predicate = ['params'];
        } else if(opts.data && !opts.params) {
          predicate = ['data'];
        } else if(opts.params && opts.data) {
          predicate = ['params', 'data'];
        }
      }

      if(predicate) {
        // Returns structured query
        for(var i=0; i<predicate.length; i++) {
          for(var param in opts[predicate[i]]) {
            console.log(opts[predicate[i]], param);
            if(!query[predicate[i]]) {query[predicate[i]] = {}}
            if($routeParams[param]) {
              query[predicate[i]][opts[predicate[i]][param]] = $routeParams[param];
            } else if(opts.useRouteParams === false) {
              query[predicate[i]][param] = opts[predicate[i]][param];
            }
          }
        }
      }

      return (Object.keys(query).length)? query : false;
    },
    /**
     * MERGE 
     * 
     * @param  {[type]} src [description]
     * @param  {[type]} ext [description]
     * @return {[type]}     [description]
     */
    merge: function(src, ext) {
      for (var p in ext) {
        try {
          // Property in destination object set; update its value.
          if ( ext[p].constructor === Object ) {
            src[p] = Model.fn.merge(src[p], ext[p]);
          } else {
            src[p] = ext[p];
          }
        } catch(e) {
          // Property in destination object not set; create it and set its value.
          src[p] = ext[p];
        }
      }

      return src;
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
   * 
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
   * 
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
   * 
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
   * 
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
  window.valenceModel = API;
  //
  // ROOTSCOPE API
  //------------------------------------------------------------------------------------------//
  // @description This API maps to the internal API to allow DOM actions to fire valence events.
  
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
                  // Just assign the entire model back to scope and let the dev decide how to use it.
                  scope[field] = data;
                } else {
                  if(data.constructor === Object) {
                    if(data.hasOwnProperty(field)) {
                      scope[field] = data[field];
                    } else {
                      console.warn('valence - model property ['+ field +'] does not exist. Cannot assign to scope');
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
              // console.warn('valence - a model $apply was attempted but none of the provided fields were found in scope [$id: '+scope.$id+'], meaning we do not really know what scope to apply the model to.');
            }
          } else {
            // console.warn('valence - Make sure your Model declaration has a [fields] property with the field names as keys for items in scope that are to receive model data.');
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
  function modelHook(key, path) {
    if(path[key].model) {
      // Force model declaration to array.
      if(path[key].model.constructor !==  Array) {
        path[key].model = [path[key].model];
      }
      // Loop through models.
      for(var m=0; m<path[key].model.length; m++) {
        for(var i=0; i<valence.models.length; i++) {
          if(valence.models[i].name === path[key].model[m]) {
            // We have a key and model match!
            API.get(valence.models[i].name, valence.models[i]);
          }
        }
      }
    } else {
      // These aren't the keys you're looking for. #jediCodeTrick
      loader.finish();
    }

    return;
  }

  route.addHook(modelHook);

  return API;
}]);
