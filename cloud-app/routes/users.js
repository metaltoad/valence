'use strict';

/*******************************************************************************************************
 * USER ROUTES
 *******************************************************************************************************
 */

exports.initRoute = function(app, User, Auth) {
  
  /**
   * /USERS
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.get('/users', function(req, res, next) {
    User.getUsers(req.query._id, function(err, user) {
      if(err) return res.send(404, err);
      var obj = {};
      res.send(200, user);
    });
  });

  /**
   * /USER
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.get('/user', app.expressJWT({secret:app.secret}), function(req, res, next) {
    var user = [req.user].map(function(itm, idx) {
      delete itm.password;
      delete itm.exp;
      delete itm.iat;
      return itm;
    });

    res.send(200, user);
  });

  /**
   * POST -> USERS
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.post('/users', function(req, res, next) {
    var body = {};



    if(!req.body) {
      res.send(400, 'No user data was sent with request');
    } else {

      for(var param in req.body) {
        body[param] = req.body[param];
      }
      User.addUser(req.body, function(err, user) {
        console.log('users.js line 38', user);
        if(err) {
          res.send(400, 'Could not add user: ' + err);
        } else if(user !== null && user !== undefined) {

          delete user.password;

          res.send(200, user);
        }
      })
    }
  });
};