var Db = require('../Db').db;
var passHash = require('password-hash');
var ObjectID = require('../Db').ObjectID;

var collection  = Db.collection('users', function(err, collection) {
  if(err) throw err;
  return collection;
});

exports.getUsers = function(fn) {
  collection.find({}).toArray(function(err, users) {
    var obj = users.map(function(itm, idx) {
      delete itm.password;
      return itm;
    });
    
    fn(err, obj);
  });
};

exports.findByUserName = function(username, fn) {
  Db.collection('users', function(err, collection) {
    if(err) throw err;
    collection.find({name: username}).toArray(function(err, items) {
      fn(err, items[0]);
    });
  });
};

exports.findById = function(id, fn) {
  id = (id && id.toString()) || undefined;

  if(!id) throw 'No ID passed to findById';

  collection.find({_id: new ObjectID(id)}).toArray(function(err, items) {
    if(err) return fn(err);
    var obj = items.map(function(itm, idx) {
      delete itm.password;
      return itm;
    });

    if(items) return fn(null, obj[0]);
  });
}

exports.validateUser = function(email, pass, fn) {
  collection.find({email:email}).toArray(function(err, item) {
    if(item.length) {
      if(passHash.verify(pass, item[0].password)) {
        fn(null, item[0]);
      } else {
        fn('Incorrect password');
      }
    } else {
      fn('Unrecognized Email');
    }
  })
};

exports.addUser = function(user, fn) {
  collection.find({email: user.email}).toArray(function(err, items) {
    if(items.length) {
      fn('email already in use.');
    } else {
      if(!user.password) {
        fn('No password provided');
      } else {
        user.password = passHash.generate(user.password);
        collection.insert(user, {w:1}, function(err, item) {
          fn(null, item[0]);
        })
      }
    }
  });
};