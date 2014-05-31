app.controller('AuthorsCtrl', function($scope, valence) {

  valence.scope('author_posts', $scope);
  
  $scope.author_posts = [];

});
