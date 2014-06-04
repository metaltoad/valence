app.controller('AuthorsCtrl', function($scope, valence) {

  valence.scope('author_posts', $scope);
  
  $scope.author_posts = [];

  $scope.excerpt = function(text) {
    if(text) {
      return text.slice(0, 250) + '...';
    }
  };

});
