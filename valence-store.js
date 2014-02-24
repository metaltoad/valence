'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - ANGULAR DATA MODULES - STORE
 *******************************************************************************************************
 * @TODO:
 *  1. Set up def
 */
ngDataApp.service('store', ['ngData', '$q', function(ngData, $q) {

  /***********************************************************************************************************************************************
   * NGDATA - STORE ADAPTERS
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
      var store = JSON.parse(window.localStorage.ngStore),
          data;

      // Get store data if there.
      if(store.hasOwnProperty(model)) {
        data = store[model];
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
      var store = JSON.parse(window.localStorage.ngStore);

      store[model] = data;

      window.localStorage.ngStore = JSON.stringify(store);

      return this.get(model);
    }
  };

  /***********************************************************************************************************************************************
   * NGDATA = STORE
   ***********************************************************************************************************************************************
   * @description On page-load/navigation: 
   */
  var Store = function() {

    // Set default storage engine
    this.store = (ngData.storageEngine && ngData.storageEngine.primary)? ngData.storageEngine.primary 
      : (ngData.storageEngine && ngData.storageEngine.fallbackToMemory)? 'memory' : (window.localStorage)? 'localStorage': [];

    // Create default LS space.
    if(this.store === 'localStorage' && window.localStorage.ngStore === undefined) {
      window.localStorage.ngStore = JSON.stringify({});
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
        qLen = (query)? Object.keys(query).length : null,
        mLen = 0,
        result;

    // Fail early and harrrrd.
    if(!data) {
      def.reject(false)
    } else {
      // if no query provided, it should be a straight 1:1 thing.
      if(!query) {
        // Resolve promise
        def.resolve(data);
      } else {
        // As all queries are kvp objects, we can assume that if the data in
        // the store is an array, they mean to query it by a collection of objects in the array.
        // However, as the original data is an array, we aggregate matched queryies back to an array.
        if(data.constructor === Array) {
          result = [];
          for(var i=0; i<data.length; i++) {
            if(data[i].constructor === Object) {
              for(var param in query) {
                if(data[i][param] && data[i][param] === query[param]) {
                  result.push(data[i]);
                }
              }
            }
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
          for(var param in query) {
            if(data[param] && data[param] === query[param]) {
              mLen++; // Increment match count
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
   * @param {[type]} model [description]
   * @param {[type]} data  [description]
   */
  Store.prototype.setModel = function(model, data) {
    var def = $q.defer(),
        res;

    // Check the store for the current model
    res = Adapters[this.store].set(model, data);

    if(res) {
      def.resolve(res);
    } else {
      def.reject(false);
    }

    // Return promise
    return def.promise;
  };

  //
  // STORE INSTANTIATION
  //------------------------------------------------------------------------------------------//
  // @description Lite 'er up.
  return new Store();
}]);
