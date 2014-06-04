valence.model('posts', {
  hasMany: {
  	model: 'post'
  },
  standAlone: 'blog',
  HTTP: {
    PUT: {url: 'posts', params: {post_id: 'post_id'}},
    GET: {url: 'posts'}
  },
  refreshModel: false,
  normalize: function(valence, args, data, q) {
    var def = q.defer();

    valence.get('users', {opts: {HTTP:{GET:{url:'users', params: null}}}}).then(function(users) {
      data.forEach(function(post) {
        users.forEach(function(user) {
          if(user._id === post.author_id) {
            post.avatar = user.avatar;
          }
        });
      });

      def.resolve(data);
    });

    return def.promise;
  }
});
