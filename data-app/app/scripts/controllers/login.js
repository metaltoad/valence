'use strict';

/*******************************************************************************************************
 * LOGIN CONTROLLER
 *******************************************************************************************************
 */
app.controller('LoginCtrl', function($scope, auth, model, $rootScope) {
  $scope.user = {};

  $scope.login = function(username, password) {
    // update user object on login
    auth.login($scope.user).then(function(authData) {
      model.get('user').then(function(user) {
        $rootScope.currentUser = user;
      });
    });
  };
});
