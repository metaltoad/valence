app.controller('BlogCtrl', function ($scope, model, $location) {
    $scope.posts = model;

    $scope.predicate = '-created';
  });