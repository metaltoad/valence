valence.model('users', {
  fields: {
    user: _model
  },
  hasMany: {
  	model: 'authors'
  },
  standAlone: 'blog/:post_id/edit'
})