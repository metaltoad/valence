var Session = require('../models/Session');
var self = this;

this.currentAuthedUser = {};

/**
 * INIT ROUTE
 * @param  {[type]} theApp      [description]
 * @param  {[type]} thePassport [description]
 * @return {[type]}             [description]
 */
exports.initRoute = function(app, User) {

  exports.createSession = function createSession(userData, fn) {
    
    if(!userData.email && !userData.password) {
      return fn(400, 'No email or password provided.');
    }
    
    console.log('line 20', userData);
    User.validateUser(userData.email, userData.password, function(err, user) {
      if (err) {return fn(404, err)}

      user = [user];
      
      user = user.map(function(itm, idx) {
        delete itm.password;
        return itm;
      });
      
      user = user[0];

      Session.createSession(user._id, function(err, token) {
        if(err) {return fn(401, err)};
        fn(200, {token: token, user: user});
      });
    });
  }

  /**
   * LOGIN
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.post('/session', function(req, res, next) {
    console.log('post to session', req);
    self.createSession(req, function(status, data) {
      res.send(status, data);
    });
  });

  /**
   * DELETE
   * 
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.delete('/session', function(req, res, next) {
    if(!req.query.token) {
      res.send(404, 'Please include the session token.')
    } else {
      Session.deleteSession(req.query.token, function(err) {
        if(err) return res.send(400, 'Unable to delete session: '+err);
        return res.send(200, 'Session deleted');
      })
    }
  });

  /**
   * SESSION
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.get('/session', function(req, res, next) {
    self.authenticate(req, function(err, data) {
      if(err) {
        res.send(401, err);
      } else {
        console.log('get session data: ', data);
        res.send(200, data);
      }
    });
  });
};

/**
 * AUTHNETICATE
 * @param  {[type]}   req [description]
 * @param  {Function} fn  [description]
 * @return {[type]}       [description]
 */
exports.authenticate = function(req, fn) {
  var token = req.query.token || req.body.token;
 if(!token) {
    fn('User not authenticated. No token found in query.')
  } else {
    Session.validateSession(token,  function(err, data) {
      if(err) return fn(err);
      return fn(null, data);
    })
  }
};

exports.isAuthenticated = function() {
  return self.currentAuthedUser._id !== undefined;
  // return true;
};

return this;