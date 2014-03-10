'use strict';

/*******************************************************************************************************
 * SIGN UP CONTROLLER
 *******************************************************************************************************
 */
app.controller('SignUpCtrl', function($scope, auth) {
  $scope.message = '';

  $scope.signUp = function() {
    auth.create($scope.user).then(function(data) {}, function(data) {
      $scope.message = data.data;
    });
  }
});