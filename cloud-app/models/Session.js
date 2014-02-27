var Db = require('../Db').db;
var passHash = require('password-hash');
var Users = require('./Users');

var collection = Db.collection('sessions', function(err, items) {
  if(err) throw err;
  return items;
});

exports.createSession = function(uid, fn) {
  var token = passHash.generate(uid.toString());

  collection.find({uid: uid}).toArray(function(err, items) {
    if(!items.length) {
      collection.insert({uid:uid, token: token}, function(err, item) {
        if(err) return fn(err);
        return fn(null, item[0].token);
      });
    } else {
      return fn(null, items[0].token);
    }
  });
};

exports.deleteSession = function(token, fn) {
  collection.remove({token:token}, {w:1}, function(err, removedCount) {
    if(err) return fn(err);
    if(!removedCount) {
      return fn('No session to remove');
    } else {
      return fn();
    }
  });
};

exports.validateSession = function(token, fn) {
  collection.find({token:token}).toArray(function(err, item) {
    if(err) return fn(err);
    
    if(item.length) {
      Users.findById(item[0].uid, function(err, user) {
        if(err) return fn(err);
        return fn(null, user)
      });
    } else {
      return fn('Could not validate user.');
    }
  });
};