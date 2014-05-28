app.directive('datanav', function($compile) {
  return {
    scope: false,
    restrict: 'E',
    templateUrl: '/scripts/directives/templates/nav.html',
    controller: function($scope, $element, $attrs, auth, $rootElement, $rootScope, model) {

      $scope.getNavTemplate = function() {
        return 'http://localhost:9000/scripts/directives/templates/' + ((auth.isValidated)? 'logged-in_nav.html' : 'logged-out_nav.html');
      };

      // This catched page load
      auth.validate().then(function(data) {
        model.get('user').then(function(user) {
          $rootScope.currentUser = user;
        });
      });

      $scope.logout = function() {
        auth.logout().then(function(data) {
          $scope.user = {};
        });
      }
    }
  }
});
