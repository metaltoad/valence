'use strict';

/*******************************************************************************************************
 * LOGIN CONTROLLER
 *******************************************************************************************************
 */
app.controller('LoginCtrl', function($scope, auth) {
  $scope.user = {};
  $scope.login = function(username, password) {
    console.log('login called');
    auth.login($scope.user);
  };
});