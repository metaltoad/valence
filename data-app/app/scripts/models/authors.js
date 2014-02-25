valence.model('authors',  {
   belongsTo: {
    type:Object,
    model: 'users',
    by: {author_id: '_id'}
  },
  hasMany: {
    model: 'author_posts',
    by: {author_id: 'author_id'}
  },
  fields: {
    authors: _model
  },
  HTTP: {
    GET: {url: 'users', params: {author_id: '_id'}}
  }
})