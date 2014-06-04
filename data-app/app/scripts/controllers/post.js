app.controller('PostCtrl', function ($scope, valence, $location) {

  valence.scope(['post', 'comments'], $scope);

  $scope.post = [];

  $scope.edit = ($location.path().match('/edit') === null)? $location.path() + '/edit' : $location.path();
  
  if(!$location.path().match('new')) {
    valence.get('comments').then(function(comments) {
      $scope.comments = comments;
    });
  }

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
      valence.get('posts', {opts: {forceFetch:true}}).then(function(posts) {
        $location.path('/blog/'+data[0]._id);
      })
    });
  };

  $scope.updatePost = function(data, id) {
    valence.put('posts', {data:data}).then(function(post) {
      $location.path('/blog/'+post[0]._id);
    });
  };
});