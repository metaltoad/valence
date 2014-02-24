'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - CORE
 *******************************************************************************************************
 */

ngDataApp.provider('ngData', {

  modelAPI: {},

  loader: {},

  model: null,

  models: [],

  viewModel: '',

  compileTarget: document.body,

  retrievalQueue: [],

  persistenceQueue: [],

  timers: [],

  retrievalProcessing: false,

  persistenceProcessing: false,

  applyQueue: [],

  appliedModels: [],

  $get: function($route) {
    this.model = ngData.model;
    this.models = ngData.models;
    ngData = this;
    return this;
  }
});
