app.controller('BlogCtrl', function ($scope, model) {
    $scope.posts = model;

    $scope.predicate = '-created';

    model.get('user');
  });