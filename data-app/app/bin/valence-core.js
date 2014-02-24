'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - CORE
 *******************************************************************************************************
 */

valenceApp.provider('valence', {

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
    this.model = valence.model;
    this.models = valence.models;
    valence = this;
    return this;
  }
});
