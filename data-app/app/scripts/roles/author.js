valenceAuth.role('author', function(promise, $routeParams, $route, $location) {
  var self = this,
      post;
    
    console.log('author role', valenceModel);
    valenceModel.get('posts', {}).then(function(posts) {
      console.log('valence get called from posts role');
      for(var i=0; i<posts.length; i++) {
        if(posts[i]._id === $routeParams.post_id) {
          post = posts[i];
        }
      }

      if(post) {
        console.log('post: ', post);
        if(post.author_id === self.getIdentity()._id) {
          promise.resolve();
        } else {
          promise.reject(null);
        }
      } else {
        promise.reject(null);
      }
    }, function(data) {
      console.log('author role rejection', data);
    });
    
});