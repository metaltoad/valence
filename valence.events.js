'use strict';

/***********************************************************************************************************************************************
 * VALENCE - EVENTS 
 ***********************************************************************************************************************************************
 * @description
 */
angular.module('Valence')
  .service('Valence.Events', [function() {
    var Events = {};

    return {
      definitions: {
        model: {
          created: 'model.created',
          destroyed: 'model.destroyed'
        },
        resource: {
          created: 'resource.created',
          destroyed: 'resource.destroyed'
        }
      },
      publish: publish,
      subscribe: subcribe
    };

    /**
     * [publish description]
     * @param  {[type]} name [description]
     * @param  {[type]} data [description]
     * @return {[type]}      [description]
     */
    function publish(name, data) {
      var event = Events[name];

      if(event) {
        event.forEach(function(fn) {
          fn(data);
        });

        Debugger.log('Event dispatched: '+ name +' - '+ data);
      } else {
        Debugger.warn('Event: ' + name +' not found, attempted publish. Consider tracing to determine source.');
      }
    }

    function subscribe(name, fn) {
      var event;

      if(!Events[name]) {
        event = Events[name] = [];
      }

      event.push(fn);
      Debugger.log('Event subscribed: '+ name + ' - '+ fn);
    }
  }]);