valence.model('author_posts', {
  fields: {
    author_posts: _model
  },
  belongsTo: {
    model: 'posts',
    type: Array,
    by: {author_id: 'author_id'}
  },
  HTTP: {
    GET: {url: 'posts', params: ['author_id']},
    POST: {url: 'posts', data: ['author_id']}
  }
});
