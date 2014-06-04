'use strict';

/*******************************************************************************************************
 * SIGN UP CONTROLLER
 *******************************************************************************************************
 */
app.controller('SignUpCtrl', function($scope, valence, $location, $rootScope) {
  $scope.message = '';

  $scope.signUp = function() {
    valence.post('users', {data: $scope.new_user, opts: {localize: false, refreshModel: false}}).then(function(data) {
      console.log($scope.new_user);
      valence.auth.login($scope.new_user).then(function(identity) {
        $rootScope.identity = identity;
      }, function(data) {
        $scope.message = data.data;
      });
    });
  }
});