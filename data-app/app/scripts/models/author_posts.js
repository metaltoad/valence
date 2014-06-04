valence.model('author_posts', {
  belongsTo: {
    model: 'posts',
    type: Array,
    by: {author_id: 'author_id'}
  },
  HTTP: {
    GET: {url: 'posts', params: {author_id: '_id'}},
    POST: {url: 'posts', data: {author_id: '_id'}}
  },
  normalize: function(valence, args, data, q) {
    var def = q.defer();

    valence.get('users', {opts: {HTTP:{GET:{url: 'users?_id='+data[0].author_id}}}, localize:false, forceFetch:true, type: Object}).then(function(user) {
      
      data[0].avatar = user[0].avatar;
      
      def.resolve(data);
    });

    return def.promise;
  }
});