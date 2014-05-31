app.controller('PostCtrl', function ($scope, valence, $location, $location) {

  valence.scope(['post', 'comments'], $scope);

  $scope.post = [];

  $scope.edit = ($location.path().match('/edit') === null)? $location.path() + '/edit' : $location.path();
  
  $scope.comments = [];

  $scope.saveComment = function(model, data) {
    valence.acl.getIdentity().then(function(identity) {
      data.author = identity.name;
      (identity._id)? data.user_id = identity._id : '';

      $scope.save(model, {data:data}).then(function(pData) {
        $scope.comment = '';
      }, function(pData) {
        console.log('isErrorings?');
      })
    })
  };

  $scope.createPost = function(data) {
    $scope.save('posts', {data:data}).then(function(data) {
      $location.path('/blog');
    });
  };

  $scope.updatePost = function(data, id) {
    $scope.update('posts', {data:data}).then(function(post) {
      $location.path('/blog/'+id);
    });
  };
});