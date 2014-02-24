ngData.model('posts', {
  fields: {
    posts: _model
  },
  hasMany: {
  	model: 'post'
  },
  standAlone: 'blog',
  persistence: {
    auth: true,
    success: function($location, data) {
      $location.path('/blog');
    }
  }
});
