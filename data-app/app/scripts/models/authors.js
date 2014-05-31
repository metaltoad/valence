valence.model('authors',  {
  belongsTo: {
    type:Object,
    model: 'users',
    by: {author_id: '_id'}
  },
  HTTP: {
    GET: {url: 'users'}
  }
})