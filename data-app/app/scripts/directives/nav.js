app.directive('datanav', function($compile) {
  return {
    scope: true,
    restrict: 'E',
    templateUrl: '/scripts/directives/templates/nav.html',
    controller: function($scope, $element, $attrs, auth, $rootElement, $rootScope) {

      $scope.currentUser = (auth.getIdentity()) ? auth.getIdentity().name : '';

      $scope.getNavTemplate = 'http://localhost:9000/scripts/directives/templates/' + ((auth.isValidated)? 'logged-in_nav.html' : 'logged-out_nav.html');
      
      auth.onceAuthed(function() {
        $compile($element)($scope);
      })

      $scope.auth = auth;
    }
  }
});
