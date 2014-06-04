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
      
    }, 100);
  };

  /**
   * GET MODEL CONFIG
   * 
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
  function getModelConfig(model) {
    var config;

    for(var i=0; i<valence.models.length; i++) {
      if(valence.models[i].name === model) {
        config = valence.models[i];
      }
    }

    if(!config && opts) {
      config = opts;
    } else if(!config && !opts) {
      throw 'Valence - model for ['+model+'] not found. Make sure to declare one through valence.model()';
    }

    return config;
  };

  /**
   * MERGE 
   * 
   * @param  {[type]} src [description]
   * @param  {[type]} ext [description]
   * @return {[type]}     [description]
   */
  function merge(src, ext) {
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
  };

  /**
   * BUILD PARAM QUERY
   * 
   * @param  {[type]} opts [description]
   * @return {[type]}      [description]
   */
  valence.buildParamQuery = function(opts) {
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
      // Predicates found, build out each one
      for(var i=0; i<predicate.length; i++) {
        // Loop through param in each predicate
        for(var param in opts[predicate[i]]) {
          // Set to object if it doesn't exist to avoid RT errors.
          if(!query[predicate[i]]) {query[predicate[i]] = {}}

          // Capture routeParams
          if($routeParams[param]) {
            // Override if HTTP
            if(predicate[i] == 'params') {
              query[predicate[i]][param] = $routeParams[param];
            } else {
              // use route params and substitution
              query[predicate[i]][opts[predicate[i]][param]] = $routeParams[param];
            }
          }

          // Ignore Route params if specified
          if(opts.useRouteParams === false) {
            query[predicate[i]][param] = opts[predicate[i]][param];
          }
        }
      }
    }
    
    return (Object.keys(query).length)? query : false;
  };

  /***********************************************************************************************************************************************
   * STRATEGY SEQUENCES
   ***********************************************************************************************************************************************
   * @description Default sequence map.
   */
  


  /*********************************************************************************************************************************************
   * MODEL CONSTRUCTOR
   *********************************************************************************************************************************************
   * @description Serves as the service entry point for working with models. At this point it
   *              does nothing more than give us a prototype chain and perform some basic,
   *              global-to-models error handling.
   *
   * @TODO Actually architect this thing instead of all this procedural bullshit.
   */
  var Model = function(action, args) {
    // Scope resolution
    var self = this;

    // Default config object
    var config = {
      loader: true,
      belongsTo: null,
      hasMany: null,
      localize: true,
      forceFetch: false,
      ignoreDefaultConfig: false,
      storeInMemory: false,
      refreshModel: true,
      fetchOnSave: true,
      auth: false
    };

    // Build config
    if(args.opts) {
      if(args.opts.ignoreDefaultConfig) {
        this.opts = args.opts;
      } else {
        this.opts = merge(config, merge(getModelConfig(args.model), args.opts));
      }
    } else {
      this.opts = merge(config, getModelConfig(args.model));
    }

    this.args = {};

    this.args.action = action;
    this.args.model = args.model;
    this.args.opts = this.opts;
    this.args.data = args.data;
    this.args.def = args.def;

    // start building strategy
    this.strategeries = [];

    // Sequence Mapping
    this.sequences = {};

    //
    // GET SEQUENCES
    //------------------------------------------------------------------------------------------//
    // @description
    this.sequences.GET = {};

    this.sequences.GET.save = [
      {fn: store.set, fail: self.halt, pass: self.conquer, overriden: self.conquer, overrides:[!self.opts.localize], name: 'store.set'}
    ];

    this.sequences.GET.redirect = [
      {fn: route.redirect, fail: self.halt, pass: self.conquer, name:'route.redirect'}
    ];

    this.sequences.GET.cloud = [
      {fn: cloud.get, fail: this.sequences.GET.redirect, pass: this.sequences.GET.save, name:'cloud.get'}
    ];

    this.sequences.GET.store = [
      {fn: store.get, fail: self.sequences.GET.cloud, pass: self.conquer, overrides:[self.opts.forceFetch], name:'store.get'}
    ];

    this.sequences.GET.init = [
      {fn: loader.run, pass: self.sequences.GET.store, overrides:[!valence.loader.enabled], name:'loader.run'}
    ];

    //
    // POST SEQUENCES
    //------------------------------------------------------------------------------------------//
    // @description
    this.sequences.POST = {};

    this.sequences.POST.store = [
      {fn: store.set, fail: self.halt, pass: self.conquer, overriden: self.conquer, overrides:[!self.opts.localize], name:'store.set'}
    ];

    this.sequences.POST.fetch = [
      {fn: cloud.get, fail: self.halt, pass: this.sequences.POST.store, name:'cloud.get', overriden: self.conquer, overrides:[!self.opts.refreshModel]}
    ];

    this.sequences.POST.cloud = [
      {fn: cloud.set, fail: self.halt, pass: this.sequences.POST.fetch, name:'cloud.set'}
    ];

    this.sequences.POST.init = [
      {fn: loader.run, pass: self.sequences.POST.cloud, overrides:[!valence.loader.enabled], name:'loader.run'}
    ];

    //
    // PUT SEQUENCES
    //------------------------------------------------------------------------------------------//
    // @description
    this.sequences.PUT = this.sequences.POST;

    //
    // DELETE SEQUENCE
    //------------------------------------------------------------------------------------------//
    // @description
    this.sequences.DELETE = {};

    this.sequences.DELETE.store = [
      {fn: store.set, fail: self.halt, pass: self.conquer, overriden: self.conquer, overrides:[!self.opts.localize], name:'store.set'}
    ];

    this.sequences.DELETE.fetch = [
      {fn: cloud.get, fail: self.halt, pass: this.sequences.DELETE.store, name:'cloud.get'}
    ];

    this.sequences.DELETE.cloud = [
      {fn: cloud.remove, fail: self.halt, pass: this.sequences.DELETE.fetch, name:'cloud.set'}
    ];

    this.sequences.DELETE.init = [
      {fn: loader.run, pass: self.sequences.DELETE.cloud, overrides:[!valence.loader.enabled], name:'loader.run'}
    ];

    // Build strategies and run them
    this.advance();
  };

  //
  // SEQUENCE PROCESSING
  //------------------------------------------------------------------------------------------//
  // @description

  /**
   * ADVANCE
   *
   * @description Moves through a sequence's strategies as needed.
   * @return {[type]} [description]
   */
  Model.prototype.advance = function() {
    var self = this,
        strategy;

    // load init
    strategy = this.sequences[this.args.action].init;

    (function fire(strategy, idx) {
        
        idx = idx || 0;
      
        strategy = strategy[idx];

        if(strategy.overrides) {
          Overrides:
          for(var j=0; j<strategy.overrides.length; j++) {
            if(strategy.overrides[j]) {
              if(strategy.overriden) {
                if(strategy.overriden.constructor === Function) {
                  return strategy.overriden(self.args);
                } else {
                  return fire(strategy.overriden);
                }
              }
              break Overrides;
            }
          }
        }
        
        strategy.fn(self.args).then(function(data) {
          
          if(data) {
            self.args.data = data;
          }

          if(strategy.pass) {
            if(strategy.pass.constructor === Function) {
              return strategy.pass(self.args);
            } else {
              return fire(strategy.pass);
            }
          } else {
            if(strategy[idx+1]) {
              return fire(strategy, idx+1);
            }
          }
        }, function(data) {

          if(data) {
            self.args.data = data
          }
          
          if(strategy.fail) {
            if(strategy.fail.constructor === Function) {
              return strategy.fail(self.args, data);
            } else {
              return fire(strategy.fail);
            }
          } else {
            if(strategy[idx+1]) {
              return fire(strategy, idx+1);
            }
          } 
        });
      
    })(strategy);
  };

  /**
   * CONQUER
   *
   * @description If a sequence is successful, move on to send the model to the UI.
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  Model.prototype.conquer = function(args) {
    apply(args);
  };

  /**
   * HALT
   * 
   * @param  {[type]} args [description]
   * @return {[type]}      [description]
   */
  Model.prototype.halt = function(args, data) {
    args.def.reject({args: args, data:data});
    loader.halt();
  };


  /***********************************************************************************************************************************************
   * VALENCE - MODEL API
   ***********************************************************************************************************************************************
   * @description Promised based API allows for a manual .get/.set invocation while also
   *              letting view-model data be wired up as normal.
   */

  /**
   * GET
   * 
   * @param  {[type]} model [description]
   * @param  {[type]} args  [description]
   * @return {[type]}       [description]
   */
  valence.get  = function(model, args) {
    var def = $q.defer();
    
    args = args || {};

    new Model('GET', {model: model, opts: args.opts, data: args.data, def: def});

    return def.promise;
  };

  /**
   * PUT
   * 
   * @param {[type]} model [description]
   * @param {[type]} data  [description]
   */
  valence.put = function(model, args) {
    var def = $q.defer();

    new Model('PUT', {model: model, opts: args.opts, data: args.data, def: def})

    return def.promise;
  };

  /**
   * POST
   * 
   * @param {[type]} model [description]
   * @param {[type]} data  [description]
   */
  valence.post = function(model, args) {
    var def = $q.defer();
    
    new Model('POST', {model: model, opts: args.opts, data: args.data, def: def});

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
  valence.remove = function(model, args) {
    var def = $q.defer();

    new Model('DELETE', {model: model, opts: args.opts, data: args.data, def: def});

    return def.promise;
  };

  /**
   * SCOPE
   *
   * @description allows for explicit definition of which scope to apply models to.
   * @param  {[type]} model [description]
   * @param  {[type]} scope [description]
   * @return {[type]}       [description]
   */
  valence.scope = function(model, scope) {

    model = (model.constructor === Array)? model : [model];

    for(var m=0; m<model.length; m++) {
      for(var i=0; i<valence.models.length; i++) {
        if(valence.models[i].name === model[m]) {
          valence.models[i].scope = scope;
        }
      }
    }

    return;
  };

  
  //
  // ROOTSCOPE valence
  //------------------------------------------------------------------------------------------//
  // @description This valence maps to the internal valence to allow DOM actions to fire valence events.
  
  /**
   * POST
   * @type {[type]}
   */
  $rootScope.save = valence.post;

  /**
   * PUT
   * @type {[type]}
   */
  $rootScope.update = valence.put;

  /**
   * REMOVE
   * @type {[type]}
   */
  $rootScope.remove = valence.remove;
  
  /***********************************************************************************************************************************************
   * CORE FUNCTIONS
   ***********************************************************************************************************************************************
   * @description Shared processing function between valence.
   */
  
  /**
   * APPLY
   * @param  {[type]} model [description]
   * @param  {[type]} data  [description]
   * @description [description]
   */
  function apply(args) {
    var scope;
    
    // Detect a scope set.
    for(var i=0; i<valence.models.length; i++) {
      if(valence.models[i].name === args.model) {
        args.scope = valence.models[i].scope;
      }
    }

    scope = args.scope || $rootScope;

    data = serialize(args.opts, args.data);

    if(args.opts.normalize) {
      args.opts.normalize(valence, args, data, $q).then(function(normalized) {
        
        scope[args.model] = normalized;

        args.def.resolve(normalized);

        loader.loaded(args.model);
      });
    } else {
      scope[args.model] = data;

      args.def.resolve(data);

      loader.loaded(args.model);
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
  // @description this section adds a callback function to the routing process.
  
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
            valence.get(valence.models[i].name, valence.models[i]);
          }
        }
      }
    } else {
      // These aren't the keys you're looking for. #jediCodeTrick
      loader.finish();
    }

    return;
  }

  // Add route hook.
  valence.route.addHook(modelHook);

  return valence;
}]);
