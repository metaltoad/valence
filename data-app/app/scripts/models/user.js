ngData.model('user', {
  fields: {
    user: _model
  },
  hasMany: {
  	model: 'authors'
  }
})