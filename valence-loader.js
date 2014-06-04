'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - ANGULAR DATA MODULES - LOADER
 *******************************************************************************************************
 */
valenceApp.service('loader', ['valence', '$q', function(valence, $q) {
  
  //
  // CONFIG
  //------------------------------------------------------------------------------------------//
  // @description Loader settings.
  
  // Model queue used in determining when to shut down the loader
  valence.loader.queue = [];
  
  // Eventually holds reference to a time stamp.
  valence.loader.loaderStarted = null;

  // Classes for applying to the loader/content based on config or defaults.
  valence.loader.loaderClasses = {
    hide: (valence.loader.classes && valence.loader.classes.hide)? valence.loader.classes.hide : 'ngLoader-hidden',
    show: (valence.loader.classes && valence.loader.classes.show)? valence.loader.classes.show : 'ngLoader-visible'
  };

  // Holds references to DOM components that have loaders.
  valence.loader.loaderCollection = [];
  valence.loader.contentCollection = [];

  // Minimum time to display the loader
  valence.loader.minLoaderDisplayTime = 250;

  //
  // OPERATIONS
  //------------------------------------------------------------------------------------------//
  // @description Loader control.
  
  /**
   * RUN
   * @param  {Object} model When the loader is called with a model, that model gets added to a bank or queue.
   *                        The models get removed from the queue via the Model layer when loaded is called with the same model.
   * @return {[type]}       [description]
   */
  valence.loader.run = function(model, opts) {
    var def = $q.defer(),
        content = valence.loader.content,
        loaderElem = valence.loader.loader,
        data;


    if(valence.loader.enabled) {
      
      if(model) {

        // Build promise resolution data is applicable.
        model = model.model || model;
        opts = model.opts || opts;
        data = model.data;

        valence.loader.queue.push({name: model, opts:opts});

        if(model.loader) {
          if(opts.loader.content) {
            content = opts.loader.content;
          }
          if(opts.loader.loader) {
            loaderElem = opts.loader.loader;
          }
        }
      }

      if(!valence.loader.loaderStarted) {
        valence.loader.loaderStarted = new Date().getTime();
      }

      content = (document.querySelectorAll(content).length) ? document.querySelectorAll(content)
        : (function() {throw 'valence - ngLoader - It was requested that ['+content+'] be hidden when initiating the loader, however, no elements could be found in the DOM'})();

      loaderElem = (document.querySelectorAll(loaderElem).length) ? document.querySelectorAll(loaderElem)
        : (function() {throw 'valence - ngLoader - It was requested that ['+loaderElem+'] be hidden when initiating the loader, however, no elements could be found in the DOM'})();

      for(var i=0; i<content.length; i++) {
        content[i].classList.add(valence.loader.loaderClasses.hide);
        content[i].classList.remove(valence.loader.loaderClasses.show);
        valence.loader.contentCollection.push(content[i]);
      }

      for(var i=0; i<loaderElem.length; i++) {
        loaderElem[i].classList.add(valence.loader.loaderClasses.show);
        loaderElem[i].classList.remove(valence.loader.loaderClasses.hide);
        valence.loader.loaderCollection.push(loaderElem[i]);
      }
    }

    def.resolve(data);
    return def.promise;
  };

  /**
   * LOADED
   * @param  {Object} model Model passed in from the model layer. Gets compared with models in current queue
   * @return {[type]}       [description]
   */
  valence.loader.loaded = function(model) {
    var newQueue = [];
    // here we check the queue for a model match and if found we remove from the queue
    // and call finished
    if(model) {
      for(var i=0; i<valence.loader.queue.length; i++) {
        if(model !== valence.loader.queue[i].name) {
          newQueue.push(valence.loader.queue[i])
        }
      }

      // safe than splicing/deleting which can fuck up indexes in ie
      valence.loader.queue = newQueue;

      valence.loader.finish();
    } else {
      throw 'valence - ngLoader - valence.loader.loaded must be passed a model so it knows how "done" it is and when to stop the loader.'
    }
  };

  /**
   * FINISH
   * 
   * @description Analyzes the current queue, if empty, reverses loader className applications
   */
  valence.loader.finish = function() {
    var self = valence.loader,
        finishedTime;
    
    if(!valence.loader.queue.length) {
      finishedTime = new Date().getTime();
      if(finishedTime - valence.loader.loaderStarted >= valence.loader.minLoaderDisplayTime) {
        valence.loader.wrapUp();
      } else {
        setTimeout(function() {
          self.wrapUp();
        }, self.minLoaderDisplayTime - (finishedTime - self.loaderStarted));
      }

      valence.loader.loaderStarted = null;
    }
  };

  /**
   * WRAP UP
   * 
   * @description  Abstracted DOM manipulation to cater to a DRY'er use of .finish()
   */
  valence.loader.wrapUp = function() {

    if(valence.loader.enabled) {
      if(!valence.loader.contentCollection.length) {
        // TODO: test valence.loader
        valence.loader.contentCollection = (document.querySelectorAll(valence.loader.content).length) ? document.querySelectorAll(valence.loader.content)
          : (function() {throw 'valence - ngLoader - It was requested that ['+valence.loader.content+'] be hidden when initiating the loader, however, no elements could be found in the DOM'})();
      }

      if(!valence.loader.loaderCollection.length) {
        valence.loader.loaderCollection = (document.querySelectorAll(valence.loader.loader).length) ? document.querySelectorAll(valence.loader.loader)
          : (function() {throw 'valence - ngLoader - It was requested that ['+valence.loader.loader+'] be hidden when initiating the loader, however, no elements could be found in the DOM'})(); 
      }

      for(var i=0; i<valence.loader.loaderCollection.length; i++) {
        valence.loader.loaderCollection[i].classList.remove(valence.loader.loaderClasses.show);
        valence.loader.loaderCollection[i].classList.add(valence.loader.loaderClasses.hide);
      }

      for(var i=0; i<valence.loader.contentCollection.length; i++) {
        valence.loader.contentCollection[i].classList.remove(valence.loader.loaderClasses.hide);
        valence.loader.contentCollection[i].classList.add(valence.loader.loaderClasses.show);
      }

      valence.loader.loaderCollection = [];
      valence.loader.contentCollection = [];
    }
  };

  /**
   * HALT
   * @description Force stops the loader but manually emptying the queue and calling finish
   */
  valence.loader.halt = function() {
    // force empty the queue, and call finish
    valence.loader.queue = [];
    valence.loader.finish();
  };


  return valence.loader;
}]);
