ngData.model('comments', {
  http: {
    GET: {url: 'comments', params: ['post_id']},
    POST: {url: 'comments', data: ['post_id']}
  },
  belongsTo: {
  	model: 'post',
  	type: Array,
  	by: {post_id: 'post_id'}
  },
  fields: {
    comments: _model
  },
  type: Array
});