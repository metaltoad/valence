'use strict';

/*******************************************************************************************************
 * LOGIN CONTROLLER
 *******************************************************************************************************
 */
app.controller('LoginCtrl', function($scope, valence, $rootScope) {

  $scope.login = function() {
    // update user object on login
    valence.auth.login($scope.creds).then(function(identity) {
      $rootScope.identity = identity;
    });
  };
});
