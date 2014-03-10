valence.model('post', {
  belongsTo: {
    model: 'posts',
    type: Object,
    by: {post_id: '_id'}
  },
  hasMany: {
    model: 'comments',
  },
  fields: {
    post: _model
  },
  HTTP: {
    GET: {url: 'posts', params: ['post_id']}
  }
});
