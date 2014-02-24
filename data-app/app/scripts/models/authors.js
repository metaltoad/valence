ngData.model('authors',  {
   belongsTo: {
    type:Object,
    model: 'user',
    by: {author_id: '_id'}
  },
  hasMany: {
    model: 'author_posts',
    by: {author_id: 'author_id'}
  },
  fields: {
    authors: _model
  },
})