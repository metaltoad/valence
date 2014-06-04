valence.model('posts', {
  hasMany: {
  	model: 'post'
  },
  standAlone: 'blog',
  HTTP: {
    PUT: {url: 'posts', params: {post_id: 'post_id'}},
    GET: {url: 'posts'}
  },
  refreshModel: false
});
