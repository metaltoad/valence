'use strict';

/*******************************************************************************************************
 * SIGN UP CONTROLLER
 *******************************************************************************************************
 */
app.controller('SignUpCtrl', function($scope, valence, $location, $rootScope) {
  $scope.message = '';

  $scope.signUp = function() {
    valence.post('users', {data: $scope.signup, opts: {localize: false, refreshModel: false}}).then(function(data) {
      valence.auth.login($scope.signup).then(function(identity) {
        $rootScope.identity = identity;
      }, function(data) {
        $scope.message = data.data;
      });
    });
  }
});