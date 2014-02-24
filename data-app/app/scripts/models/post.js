ngData.model('post', {
  belongsTo: {
    model: 'posts',
    type: Object,
    by: {post_id: '_id'}
  },
  hasMany: {
    model: 'comments',
  },
  fields: {
    _id: '_id',
    picture: 'picture',
    author: 'author',
    title: 'title',
    body: 'body',
    author_id: 'author_id'
  },
  HTTP: {
    GET: {url: 'posts', params: ['post_id']}
  }
});
