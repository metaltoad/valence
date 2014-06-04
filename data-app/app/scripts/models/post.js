valence.model('post', {
  belongsTo: {
    model: 'posts',
    type: Object,
    by: {post_id: '_id'}
  },
  HTTP: {
    GET: {url: 'posts', params: {post_id: '_id'}, redirect: {404: '/404', 500: '/500'}}
  },
  type:Object,
  normalize: function(valence, args, data, q) {
    var def = q.defer();

    valence.get('users', {opts: {HTTP:{GET:{url: 'users?_id='+data.author_id}}}, localize:false, forceFetch:true, type: Object}).then(function(user) {
      
      data.avatar = user[0].avatar;
      
      def.resolve(data);
    });

    return def.promise;
  }
});
