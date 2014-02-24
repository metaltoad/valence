app.controller('AuthorsCtrl', function($scope, model) {
  $scope.authors = model;

  $scope.author_posts = [];

  // model.get('post', {belongsTo: {
  //   model: 'posts',
  //   type: Collection,
  //   by: {author_id: 'author_id'}
  // }}).then(function(data) {
  //   $scope.posts = data;
  // });
});