valence.model('author_posts', {
  belongsTo: {
    model: 'posts',
    type: Array,
    by: {author_id: 'author_id'}
  },
  HTTP: {
    GET: {url: 'posts', params: {author_id: '_id'}},
    POST: {url: 'posts', data: {author_id: '_id'}}
  }
});