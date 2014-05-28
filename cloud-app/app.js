'use strict';

/*******************************************************************************************************
 * ANGULAR-DATA CLOUD SERVER
 *******************************************************************************************************
 */

//
// MODULES
//------------------------------------------------------------------------------------------//
// @description commonjs modules.
var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;
var Db = require('./Db');
var utils = require('./utils');
var flash = require('connect-flash');
var MongoStore = require('connect-mongostore')(express);
var expressJWT = require('express-jwt');
var JWT = require('jsonwebtoken');
var app = express();

// // Passport config
// app.configure(function() {
//   app.use(express.logger());
//   app.use(express.cookieParser());
//   app.use(express.bodyParser());
//   app.use(express.methodOverride());
//   app.use(express.session({ secret: 'angular-data', key: 'connect.sid', store: new MongoStore({'db': 'sessions'})}));
//   app.use(express.static(__dirname + './'));
//   // Initialize Passport!  Also use passport.session() middleware, to support
//   // persistent login sessions (recommended).
//   app.use(flash());
//   app.use(passport.initialize());
//   app.use(passport.session());
//   app.use(app.router);
// });
app.configure(function(){
  app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.json());
    app.use(express.urlencoded());
    // app.use(express.session({ secret: 'angular-data', key: 'connect.sid', store: new MongoStore({'db': 'sessions'}), maxAge: 360*5}));
    // app.use(express.session())
    // app.use(passport.initialize());
    // app.use(passport.session());
    // app.use(passport.authenticate('remember-me'));
    app.use(app.router);
});

app.expressJWT = expressJWT;
app.JWT = JWT;
app.secret = 'valence';

// Config
var port = 9001;
var self = this;

//
// MODELS
//------------------------------------------------------------------------------------------//
var Users = require('./models/Users');
var Posts = require('./models/Posts');
var Comments = require('./models/Comments');

//
// INIT
//------------------------------------------------------------------------------------------//
// @Launches webserver

/**
 * GO FOR LAUNCH
 * 
 * @param  {[type]} go  [description]
 * @param  {[type]} err [description]
 * @description  Launches server if DB conn can be made.
 */
exports.goForLaunch = function(go, err) {
  var self = this;

  if(!go) {
    throw err
  }
  // Start Express Server
  app.listen(port);
  console.log('Server started on '+port);

  //
  // BASE ROUTES AND CONFIG/HEADERS
  //------------------------------------------------------------------------------------------//
  //
  app.get('/', function(req, res) {
    res.send('angular-data db');
  });

  // all access control origin for development
  app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
    res.header('Access-Control-Expose-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
    if ('OPTIONS' == req.method) {
         res.send(200);
     } else {
         next();
     }
  });


  //
  // APPLICATION ROUTES
  //------------------------------------------------------------------------------------------//
  var authRoutes = require('./routes/auth'); // Auth Routes
  var userRoutes = require('./routes/users'); // User Routes
  var postsRoutes = require('./routes/posts'); // Posts
  var commentsRoutes = require('./routes/comments'); // Posts

  // ROUTE INIT OPTS
  authRoutes.initRoute(app, Users);
  userRoutes.initRoute(app, Users, authRoutes);
  postsRoutes.initRoute(app, Posts, authRoutes);
  commentsRoutes.initRoute(app, Comments);
  return this;
};


//
// PASSPORT AUTH
//------------------------------------------------------------------------------------------//
//
//

// passport.serializeUser(function(user, done) {
//   console.log('serializer', user);
//   done(null, user._id);
// });

// passport.deserializeUser(function(id, done) {
//   console.log('deser', id);
//   User.find(id, function (err, user) {
//     done(err, user);
//   });
// });

// // Use the LocalStrategy within Passport.
// //   Strategies in passport require a `verify` function, which accept
// //   credentials (in this case, a username and password), and invoke a callback
// //   with a user object.  In the real world, this would query a database;
// //   however, in this example we are using a baked-in set of users.
// passport.use(new LocalStrategy({usernameField: 'email'},
//   function(email, password, done) {
//     console.log(arguments);
//     // asynchronous verification, for effect...
//     process.nextTick(function () {
      
//       // Find the user by username.  If there is no user with the given
//       // username, or the password is not correct, set the user to `false` to
//       // indicate failure and set a flash message.  Otherwise, return the
//       // authenticated `user`.
//       User.validateUser(email, password, function(err, user) {
//         console.log(err, user);
//         if (err) { return done(err); }
//         return done(null, user);
//       })
//     });
//   }
// ));

// passport.use(new RememberMeStrategy({usernameField: 'email'},
//   function(token, done) {
//     console.log('remember me called');
//     consumeRememberMeToken(token, function(err, uid) {
//       if (err) { return done(err); }
//       if (!uid) { return done(null, false); }
      
//        // Find the user by username.  If there is no user with the given
//       // username, or the password is not correct, set the user to `false` to
//       // indicate failure and set a flash message.  Otherwise, return the
//       // authenticated `user`.
//     });
//   },
//   tokens.issueToken
// ));

//
// EXPORTS
//------------------------------------------------------------------------------------------//
// @descript Scope variables exported for cross-file access
return this;
