'use strict';

/*******************************************************************************************************
 * USER ROUTES
 *******************************************************************************************************
 */

exports.initRoute = function(app, User, Auth) {

  app.get('/user', function(req, res, next) {
    User.getUsers(function(err, user) {
      if(err) return res.send(404, err);
      var obj = {};
      res.send(200, user);
    });
  });

  /**
   * POST -> USERS
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.post('/user', function(req, res, next) {
    var params;

    if(!req.body) {
      res.send(400, 'No user data was sent with request');
    } else {
      if(req.params.length && !req.body) {
        params = req.params;
      } else if(req.body && !req.params.length) {
        params = req.body;
      }

      User.addUser(params, function(err, user) {
        console.log(user);
        if(err) {
          res.send(400, 'Could not add user: ' + err);
        } else if(user !== null && user !== undefined) {

          var body = {
            name: user.name,
            _id: user._id,
            email: user.email
          };

          // This should probably be wrapped in a config option
          Auth.createSession(body, function(status, msg) {
            res.send(status, msg);
          });
        }
      })
    }
  });
};