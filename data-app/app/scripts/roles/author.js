valence.role('author', function(valence, q) {
  var self = this,
      def = q.defer(),
      post;
   
  valence.get('post').then(function(post) {
    valence.acl.getIdentity().then(function(identity) {
      if(post.author_id === identity._id) {
        console.log('pass');
        def.resolve();
      } else {
        def.reject();
      }
    })
  });

  return def.promise;
});