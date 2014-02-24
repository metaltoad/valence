ngAuth.role('author', function(promise, $routeParams, $route) {
  var self = this,
      match = false;

  ngModel.get('user').then(function(users) {
    var user = null,
        post = null;

    for(var i=0; i<users.length; i++) {
      if(users[i]._id === self.getIdentity()._id) {
        user = users[i];
      }
    }
    if(user) {
      ngModel.get('posts').then(function(posts) {
        for(var i=0; i<posts.length; i++) {
          if(posts[i]._id === $routeParams.post_id) {
            post = posts[i];
          }
        }

        if(post) {
          if(post.author_id === user._id) {
            promise.resolve(user);
          } else {
            promise.reject(null);
          }
        } else {
          promise.reject(null);
        }
      });
    } else {
      promise.reject(null);
    }
  });
});