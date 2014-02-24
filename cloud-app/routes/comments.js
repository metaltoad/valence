'use strict';

/*******************************************************************************************************
 * USER ROUTES
 *******************************************************************************************************
 */

exports.initRoute = function(app, Comments) {

  app.get('/comments', function(req, res, next) {
    console.log(req);
    if(!req.query.post_id) {
      res.send(400, 'Please include the post_id of the comments you would like to get.');
    }

    Comments.getComments(req.query.post_id, function(err, comments) {
      if(err) return res.send(400, err);
      res.send(200, comments);
    });
  });

  app.post('/comments', function(req, res, next) {
    Comments.createComment(req.body, function(err, data) {
      if(err) return res.send(400, 'Could not create post: '+err);
      res.send(200, data);
    })
  });
};