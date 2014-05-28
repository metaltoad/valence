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
    var token;

    if(!userData.email && !userData.password) {
      return fn(400, 'No email or password provided.');
    }
    
    User.validateUser(userData.email, userData.password, function(err, user) {
      if (err) {return fn(404, err)}

      token = app.JWT.sign(user, app.secret, {expiresInMinutes: 1440});

      return fn(200, {token:token});
    });
  };

  /**
   * LOGIN
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.post('/session', function(req, res, next) {
    self.createSession(req.body, function(status, data) {
      res.send(status, data);
    });
  });

  /**
   * SESSION
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.get('/session', app.expressJWT({secret:app.secret}), function(req, res, next) {
    if(req.user) return res.send(200);
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
    });
  }
};

return this;
