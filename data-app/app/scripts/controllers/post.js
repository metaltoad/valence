app.controller('PostCtrl', function ($scope, model, $location, auth, $location) {
  $scope.post = model.post;
  $scope.edit = ($location.path().match('/edit') === null)? $location.path() + '/edit' : $location.path();
  console.log($scope.edit);
  $scope.comments = model.comments;

  $scope.saveComment = function(model, data) {
    $scope.save(model, data).then(function(pData) {
      $scope.comment = '';
    }, function(pData) {
      console.log('isErrorings?');
    })
  };

  $scope.createPost = function(data) {
    $scope.save('posts', data).then(function(data) {
      $location.path('/blog');
    });
  };

  $scope.updatePost = function(data, id) {
    $scope.update('posts', data).then(function(post) {
      $location.path('/blog/'+id);
    });
  };
});