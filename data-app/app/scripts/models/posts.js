valence.model('posts', {
  fields: {
    posts: _model
  },
  hasMany: {
  	model: 'post'
  },
  standAlone: 'blog',
  persistence: {
    auth: true
  },
  HTTP: {
    PUT: {url: 'posts', params: {post_id: 'post_id'}}
  },
  localize:false
});
