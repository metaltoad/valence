'use strict';

/*******************************************************************************************************
 * SIGN UP CONTROLLER
 *******************************************************************************************************
 */
app.controller('SignUpCtrl', function($scope, auth, model, $location, $rootScope) {
  $scope.message = '';

  $scope.signUp = function() {
    
    model.post('users', {data: $scope.user, opts: {localize: false, refreshModel: false}}).then(function(data) {
      console.log(data);
      auth.login($scope.user).then(function(authData) {
        model.get('user').then(function(user) {
          $rootScope.currentUser = user;
        });
        $location.path('/blog');
      }, function(data) {
        $scope.message = data.data;
      });
    });
  }
});