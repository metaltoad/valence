'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - CORE
 *******************************************************************************************************
 * @description holds pre-config module definitions to avoid undefined errors.
 */

valenceApp.provider('valence', {

  loader: {},

  models: [],

  roles: [],

  cloud: {},

  store: {},

  acl: {
    identity: {}
  },

  auth: {
    endpoints: {
      login:{},
      logout: {},
      validate: {}
    }
  },

  route: {},

  storageEngine: {primary: 'localStorage', fallbackToMemory: true},

  $get: function($route) {
    this.model = valence.model;
    this.models = valence.models;
    this.role = valence.role;
    this.roles = valence.roles;
    valence = this;
    return this;
  }
});
