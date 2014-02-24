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
    console.log(model, data);
    $scope.save(model, data).then(function(pData) {
      console.log(pData);
      $scope.comment = '';
    }, function(pData) {
      console.log('isErrorings?');
    })
  }
});