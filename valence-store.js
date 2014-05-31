'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - ANGULAR DATA MODULES - STORE
 *******************************************************************************************************
 * @TODO:
 *  1. Set up def
 */
valenceApp.service('store', ['valence', '$q', function(valence, $q) {

  /**
   * IN MEMORY STORE
   * 
   * @type {Object}
   */
  var store = window.valenceStore = {};

  /***********************************************************************************************************************************************
   * VALENCE - STORE ADAPTERS
   ***********************************************************************************************************************************************
   * @description On page-load/navigation: 
   */
  var Adapters = {};

  //
  // LOCAL STORAGE ADAPTER
  //------------------------------------------------------------------------------------------//
  // @description Interface for LS persistence.
  
  Adapters.localStorage = {
    /**
     * GET
     * 
     * @param  {[type]} args.model [description]
     * @return {[type]}       [description]
     */
    get: function(model) {
      var store = JSON.parse(window.localStorage.valenceStore),
          data;

      // Get store data if there.
      if(store.hasOwnProperty(args.model)) {
        data = store[args.model];
      }

      return data;
    },
    /**
     * SET
     * 
     * @param {[type]} args.model [description]
     * @param {[type]} data  [description]
     */
    set: function(model, data) {
      var store = JSON.parse(window.localStorage.valenceStore);

      store[args.model] = data;

      window.localStorage.valenceStore = JSON.stringify(store);

      return this.get(args.model);
    },
    remove: function(model) {
      var store = JSON.parse(window.localStorage.valenceStore);

      // Get store data if there.
      if(store.hasOwnProperty(model)) {
        delete store[args.model];

        window.localStorage.valenceStore = JSON.stringify(store);
        return true;
      } else {
        return false;
      }
    }
  };


  //
  // IN MEMORY ADAPTER
  //------------------------------------------------------------------------------------------//
  // @description
  
  Adapters.memory = {
    /**
     * GET
     * 
     * @param  {[type]} args.model [description]
     * @return {[type]}       [description]
     */
    get: function(model) {
      var data;

      // Get store data if there.
      if(store.hasOwnProperty(model)) {
        data = store[model];
      }

      return data;
    },
    /**
     * SET
     * 
     * @param {[type]} args.model [description]
     * @param {[type]} data  [description]
     */
    set: function(model, data) {
    
      store[model] = data;

      return this.get(model);
    },
    /**
     * REMOVE
     * @param  {[type]} args.model [description]
     * @return {[type]}       [description]
     */
    remove: function(model) {

      // Get store data if there.
      if(store.hasOwnProperty(model)) {
        delete store[model];
        return true;
      } else {
        return false;
      }
    }
  };

  /***********************************************************************************************************************************************
   * VALENCE = STORE
   ***********************************************************************************************************************************************
   * @description On page-load/navigation: 
   */
  
  valence.store = {};
  
  var engine = (valence.storageEngine && valence.storageEngine.primary)? valence.storageEngine.primary 
      : (valence.storageEngine && valence.storageEngine.fallbackToMemory)? 'memory' : (window.localStorage)? 'localStorage': [];

  // Create default LS space.
  if(engine === 'localStorage') {
    if(valence.storageEngine.fetchOnReload || window.localStorage.valenceStore === undefined) {
      window.localStorage.valenceStore = JSON.stringify({});
    }
  }

  /**
   * GET MODEL
   * 
   * @param  {[type]} args.model [description]
   * @param  {[type]} args.query [description]
   * @return {[type]}       [description]
   */
  valence.store.get = function(args) {
    var def = $q.defer(),
        data = Adapters[engine].get(args.model),
        qLen = 0,
        mLen = 0,
        result;

    // Localization or restoration controls
    // These api properties allow a user to prevent data from being localy stored
    // or to force an update from the cloud by simply rejecting the promise. Forcing
    // the next step in the getter flow to fetch from cloud
    if(args.opts && args.opts.localize === false || args.opts.forceFetch === true) {
      def.reject('store');
    }

    // Fail early and harrrrd.
    if(!data) {
      def.reject(false)
    } else {

      // Has query-able items?
      if(args.opts.belongsTo) {
        args.query = valence.buildParamQuery(args.opts.belongsTo);
      }

      // if no args.query provided, it should be a straight 1:1 thing.
      if(!args.query) {
        // Resolve promise
        def.resolve(data);
      } else {
        // As all queries are kvp objects, we can assume that if the data in
        // the store is an array, they mean to args.query it by a collection of objects in the array.
        // However, as the original data is an array, we aggregate matched args.queryies back to an array.
        
        // Build args.query length outside of the for loop
        // so it doesn't get bloated
        for(var type in args.query) {
          for(var param in args.query[type]) {
            qLen++;
          }
        }

        if(data.constructor === Array) {
          result = [];
          for(var i=0; i<data.length; i++) {
            if(data[i].constructor === Object) {
              for(var type in args.query) {
                for(var param in args.query[type]) {
                  // Non strict equals here.
                  if(data[i][param] && data[i][param] == args.query[type][param]) {
                    mLen++;
                    // If more than 0 and equal
                    if(qLen && mLen && qLen === mLen) {
                      // Since this can hit many times, only push
                      // data to result set if not already there.
                      if(result.indexOf(data[i]) === -1) {
                        result.push(data[i]);
                      }
                    }
                  }
                }
              }
            }
            // After each data set (row) iteration, reset matched counter
            mLen = 0;
          }
          
          // Structure processed
          // determine validity.
          if(result.length) {
            def.resolve(result);
          } else {
            def.reject(result);
          }
        } else if(data.constructor === Object) {
          // loop through args.query to compare with data
          for(var type in args.query) {
            for(var param in args.query[type]) {
              qLen++;
              if(data[param] && data[param] === args.query[type][param]) {
                mLen++;
              }
            }
          }

          // As long as they aren't both zero and
          // the args.query matches are the same length as the total queries, we win.
          if(qLen && mLen && qLen === mLen) {
            def.resolve(data);
          } else {
            def.reject(data);
          }
        }
      }
    }

    // Return promise
    return def.promise;
  };

  /**
   * SET MODEL
   * @param {[type]} args.model [description]
   * @param {[type]} data  [description]
   */
  valence.store.set = function(args) {
    var def = $q.defer(),
        res;

     // Resolve the promise right away if localized is
    // set to false
    if(args.opts && args.opts.localize === false) {
      def.resolve(args.data);
    } else {

      // Check the store for the current args.model
      res = Adapters[engine].set(args.model, args.data);
      
      if(res) {
        def.resolve(res);
      } else {
        def.reject(false);
      }
    }

    // Return promise
    return def.promise;
  };

  /**
   * DELETE MODEL
   * @param  {[type]} args.model [description]
   * @return {[type]}       [description]
   */
  valence.store.remove = function(args) {
    var def = $q.defer();

    if(Adapters[engine].remove(args.model)) {
      def.resolve(true);
    } else {
      def.reject(false);
    }

    return def.promise;
  };

  //
  // STORE INSTANTIATION
  //------------------------------------------------------------------------------------------//
  // @description Lite 'er up.
  return valence.store;
}]);
