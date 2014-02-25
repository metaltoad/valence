var Db = require('../Db').db;
var Users = require('./Users');
// var Posts = require('./Posts');

var collection = Db.collection('comments', function(err, items) {
  if(err) throw err;
  return items;
});

exports.getComments = function(id, fn) {
  collection.find({post_id: id}).toArray(function(err, items) {
    fn(err, items);
  });
};

exports.createComment = function(data, fn) {
  collection.insert(data, function(err, item) {
    return fn(err, item);
  });
};