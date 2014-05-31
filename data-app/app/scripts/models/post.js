valence.model('post', {
  belongsTo: {
    model: 'posts',
    type: Object,
    by: {post_id: '_id'}
  },
  HTTP: {
    GET: {url: 'posts', params: {post_id: '_id'}}
  }
});
