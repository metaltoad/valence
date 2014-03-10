'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - ANGULAR DATA MODULES - STORE
 *******************************************************************************************************
 * @TODO:
 *  1. Set up def
 */
valenceApp.service('store', ['valence', '$q', function(valence, $q) {

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
     * @param  {[type]} model [description]
     * @return {[type]}       [description]
     */
    get: function(model) {
      var store = (window.localStorage.valenceStore)? JSON.parse(window.localStorage.valenceStore) : {},
          data;

      // Get store data if there.
      if(store.hasOwnProperty(model)) {
        if(store[model].constructor === Object && Object.keys(store[model]).length) {
          data = store[model];
        } else if(store[model].constructor === Array && store[model].length) {
          data = store[model];
        }
      }

      return data;
    },
    /**
     * SET
     * 
     * @param {[type]} model [description]
     * @param {[type]} data  [description]
     */
    set: function(model, data) {
      var store = (window.localStorage.valenceStore)? JSON.parse(window.localStorage.valenceStore) : {};

      store[model] = data;

      window.localStorage.valenceStore = JSON.stringify(store);

      return this.get(model);
    },
    /**
     * REMOVE
     * 
     * @param  {[type]} model [description]
     * @return {[type]}       [description]
     */
    remove: function(model) {
      var store = (window.localStorage.valenceStore)? JSON.parse(window.localStorage.valenceStore) : {};

      // Get store data if there.
      if(store.hasOwnProperty(model)) {
        delete store[model];

        window.localStorage.valenceStore = JSON.stringify(store);
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
  var Store = function() {

    // Set default storage engine
    this.store = (valence.storageEngine && valence.storageEngine.primary)? valence.storageEngine.primary 
      : (valence.storageEngine && valence.storageEngine.fallbackToMemory)? 'memory' : (window.localStorage)? 'localStorage': [];

    // Create default LS space.
    if(this.store === 'localStorage') {
      if(valence.storageEngine.fetchOnReload) {
        window.localStorage.valenceStore = JSON.stringify({});
      } else if(window.localStorage.valenceStore === undefined) {
        window.localStorage.valenceStore = JSON.stringify({});
      }
    }

    // Globalize it while debugging
    return window.Store = this;
  };

  /**
   * GET MODEL
   * 
   * @param  {[type]} model [description]
   * @param  {[type]} query [description]
   * @return {[type]}       [description]
   */
  Store.prototype.getModel = function(model, opts, query) {
    var def = $q.defer(),
        data = Adapters[this.store].get(model),
        qLen = 0,
        mLen = 0,
        result;


    // Localization or restoration controls
    // These api properties allow a user to prevent data from being localy stored
    // or to force an update from the cloud by simply rejecting the promise. Forcing
    // the next step in the getter flow to fetch from cloud
    if(opts && opts.localize === false || opts.forceFetch === true) {
      def.reject();
    }
    
    // Fail early and harrrrd.
    if(!data) {
      def.reject()
    } else {
      // if no query provided, it should be a straight 1:1 thing.
      if(!query) {
        // Resolve promise
        def.resolve(data);
      } else {
        // As all queries are kvp objects, we can assume that if the data in
        // the store is an array, they mean to query it by a collection of objects in the array.
        // However, as the original data is an array, we aggregate matched queryies back to an array.
        
        // Build query length outside of the for loop
        // so it doesn't get bloated
        for(var type in query) {
          for(var param in query[type]) {
            qLen++;
          }
        }

        if(data.constructor === Array) {
          result = [];
          for(var i=0; i<data.length; i++) {
            if(data[i].constructor === Object) {
              for(var type in query) {
                for(var param in query[type]) {
                  // Non strict equals here.
                  if(data[i][param] && data[i][param] == query[type][param]) {
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
          // loop through query to compare with data
          for(var type in query) {
            for(var param in query[type]) {
              qLen++;
              if(data[param] && data[param] === query[type][param]) {
                mLen++;
              }
            }
          }

          // As long as they aren't both zero and
          // the query matches are the same length as the total queries, we win.
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
   * 
   * @param {[type]} model [description]
   * @param {[type]} data  [description]
   */
  Store.prototype.setModel = function(model, data, opts) {
    var def = $q.defer(),
        res;

    // Resolve the promise right away if localized is
    // set to false
    if(opts && opts.localize === false) {
      console.log(model, opts, data);
      def.resolve(data);
    } else {
      // Check the store for the current model
      res = Adapters[this.store].set(model, data);
      
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
   * 
   * @param  {[type]} model [description]
   * @return {[type]}       [description]
   */
  Store.prototype.deleteModel = function(model) {
    var def = $q.defer();

    if(Adapters[this.store].remove(model)) {
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
  return new Store();
}]);
