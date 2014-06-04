'use strict';

/*******************************************************************************************************
 * ANGULAR DATA - CORE
 *******************************************************************************************************
 * @description holds pre-config module definitions to avoid undefined errors.
 */

valenceApp.provider('valence', {

  route: {},

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
