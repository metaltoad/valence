var Db = require('../Db').db;
var ObjectID = require('../Db').ObjectID;
var Users = require('./Users');

var self = this;

var placeImageTexts = [
  'Your mom goes to college',
  'Did I invent Hip Hop? No, but I was there.',
  'One time at band camp',
  "I'm in a glass case of emotion!",
  "I like to make sexy time!",
  "Great success!",
  "Who throws a shoe? Honestly!"
];

var collection = Db.collection('posts', function(err, items) {
  if(err) throw err;
  return items;
});

exports.getPosts = this.getPosts = function(id, fn) {
  var query = {};

  if(id) {
    query = {_id: new ObjectID(id)};
  }

  collection.find(query).toArray(function(err, items) {
    if(id && items.constructor === Array && items.length === 1) {
      items = items[0]
    }
    return fn(err, items);
  });
};

exports.getPostsByAuthorId = this.getPostsByAuthorId = function(id, fn) {
  var query = {};

  if(id) {
    query = {author_id: new ObjectID(id)};
  } else {
    return fn('Please provide an ID');
  }

  collection.find(query).toArray(function(err, items) {
    return fn(err, items);
  });
};

/**
 * FIND BY ID
 * @param  {[type]}   id [description]
 * @param  {Function} fn [description]
 * @return {[type]}      [description]
 */
exports.findById = this.findById = function(id, fn) {
  collection.find({_id: new ObjectID(id)}).toArray(function(err, item) {
    return fn(err, item);
  });
};

exports.newPost = function(data, fn) {
  collection.find({title: data.title, author_id: data.author_id}).toArray(function(err, items) {
    if(!items.length) {
      Users.findById(data.author_id, function(err, user) {
        if(err) return fn(err);
        data.author = user.name;
        data.picture = "http://dummyimage.com/400x100&text="+placeImageTexts[parseInt(Math.random() * (placeImageTexts.length))];
        data.created = new Date().getTime();
        collection.insert(data, {w:1}, function(err, doc) {
          if(err) return fn(err);
          return fn(null, doc);
        });
      });
    } else {
      fn('Post with title '+ data.title +' already exists by this author.')
    }
  });
};

exports.updatePost = function(data, fn) {
  var saveObj = {};
  for(var prop in data) {
    if(prop !== '_id') {
      saveObj[prop] = data[prop];
    }
  };
  collection.update({_id: new ObjectID(data._id)}, {$set: saveObj}, {safe: true}, function(err, item) {
    if(err) return fn(err);
    collection.find({_id: new ObjectID(data._id)}).toArray(function(err, item) {
      if(err) return fn(err);
      return fn(null, item);
    });
  });
};