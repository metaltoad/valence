app.controller('SaveCtrl', function($scope, model) {
  model.get('users', $scope);
});