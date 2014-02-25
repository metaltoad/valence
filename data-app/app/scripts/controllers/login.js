'use strict';

/*******************************************************************************************************
 * LOGIN CONTROLLER
 *******************************************************************************************************
 */
app.controller('LoginCtrl', function($scope, auth) {
  $scope.user = {};
  $scope.login = function(username, password) {
    auth.login($scope.user);
  };
});