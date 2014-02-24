'use strict';

/*******************************************************************************************************
 * SIGN UP CONTROLLER
 *******************************************************************************************************
 */
app.controller('SignUpCtrl', function($scope, auth) {
  $scope.message = '';

  $scope.signUp = function() {
    auth.new($scope.user).then(function(data) {}, function(data) {
      $scope.message = data.data;
    });
  }
});