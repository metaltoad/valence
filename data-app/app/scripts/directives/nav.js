app.directive('datanav', function($compile) {
  return {
    scope: false,
    restrict: 'E',
    templateUrl: view_prefix +'/scripts/directives/templates/nav.html',
    controller: function($scope, $element, $attrs, $rootElement, $rootScope, valence) {

      $scope.getNavTemplate = function() {
        return 'scripts/directives/templates/' + ((valence.auth.isValidated)? 'logged-in_nav.html' : 'logged-out_nav.html');
      };

      // This catched page load
      valence.auth.validate().then(function(identity) {
        $rootScope.identity = identity;
      });

      $scope.logout = function() {
        valence.auth.logout().then(function(identity) {
          $rootScope.identity = identity;
        });
      }
    }
  }
});