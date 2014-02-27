app.controller('PostCtrl', function ($scope, model, $location, auth, $location) {
  $scope._id = model._id;
  $scope.picture = model.picture;
  $scope.title = model.title;
  $scope.author = model.author;
  $scope.body = model.body;
  $scope.author_id = model.author_id;
  $scope.edit = ($location.path().match('/edit') === null)? $location.path() + '/edit' : $location.path();
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