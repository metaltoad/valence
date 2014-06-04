var Db = require('../Db').db;
var ObjectID = require('../Db').ObjectID;
var Users = require('./Users');

var self = this;

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
    console.log(items);
    if(err) return fn(err, 500, items);

    if(items.length === 1) {
      items = items[0]
      return fn(null, 200, items);
    } else if(items.length > 1) {
      return fn(null, 200, items);
    } else if(!id && !items.length) {
      return fn(null, 200, items);
    } else {
      return fn('Could not find post', 404, items);
    }
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
    if(err) return fn(err, 500, item);

    if(!item.length) {
      return fn('Could not find post', 404, item)
    }

    return fn(err, item);
  });
};

exports.newPost = function(data, fn) {
  collection.find({title: data.title, author_id: data.author_id}).toArray(function(err, items) {
    if(!items.length) {
      Users.findById(new ObjectID(data.author_id), function(err, user) {
        if(err) return fn(err);
        data.author_id = new ObjectID(data.author_id);
        data.author = user.name;
        data.avatar = "http://placehold.it/64x64";
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

exports.updatePost = function(data, id, fn) {

  collection.update({_id: new ObjectID(id)}, {$set: data}, {safe: true}, function(err, item) {
    if(err) return fn(err);
    collection.find({_id: new ObjectID(id)}).toArray(function(err, post) {
      if(err) return fn(err);
      return fn(null, post);
    });
  });
};

exports.insertPosts = function() {

  var titleBaseNumber,
      numberOfPostsToAdd = 400,
      users,

      body =  "Cupcake ipsum dolor sit amet fruitcake. Wafer dessert halvah jelly beans chocolate cake chocolate lemon drops powder. Gummies dragée marzipan cake bonbon dragée cotton candy muffin. Candy danish fruitcake." +
              "Jelly wafer sesame snaps cookie gummies gingerbread candy canes. Jelly tiramisu chocolate unerdwear.com cookie chocolate cake caramels candy gummies. Brownie cupcake macaroon chocolate cake jujubes applicake powder." +
              "Pastry biscuit cookie cheesecake chocolate apple pie dessert. Sugar plum gingerbread powder pie applicake. Gummi bears chocolate bar pie cookie. Tart tiramisu tiramisu. Pie donut wafer oat cake tootsie roll biscuit brownie chocolate cake." +
              "Cookie wafer toffee bonbon sweet donut applicake. Halvah cotton candy ice cream macaroon gummi bears cake pie soufflé danish. Biscuit pastry candy canes chocolate cake sugar plum pudding donut gingerbread. Pastry candy gummies jelly bonbon." +
              "Jujubes jelly beans macaroon. Toffee cookie soufflé lemon drops jelly beans cake pudding cake carrot cake. Candy tiramisu cake muffin bear claw topping sugar plum. Biscuit chocolate bar brownie fruitcake toffee sesame snaps tiramisu dessert." +
              "Candy pie pastry muffin chupa chups bear claw sesame snaps. Tart jelly beans muffin dragée dessert. Tiramisu carrot cake macaroon tootsie roll candy canes tart soufflé gummi bears. Candy canes croissant pastry." +
              "Cotton candy macaroon croissant carrot cake cookie pie jelly pie. Cake marzipan chocolate. Gummies chupa chups wafer sesame snaps jelly-o sweet roll. \n" +
              "Candy oat cake tiramisu toffee cake cupcake donut caramels dessert. Candy sweet roll dragée. Lemon drops pastry toffee jelly sweet roll jelly muffin danish halvah." +
              "Marzipan apple pie caramels topping lollipop fruitcake gingerbread. Apple pie ice cream jelly beans cheesecake candy oat cake. Donut wafer lemon drops tootsie roll apple pie cupcake jelly beans." +
              "Halvah carrot cake cookie muffin. Bear claw jelly chocolate cheesecake sesame snaps marzipan brownie pie. Dessert muffin chocolate cake marshmallow applicake ice cream sweet roll chocolate bar chocolate. Wafer applicake biscuit icing brownie cotton candy gingerbread. Croissant tootsie roll danish. Dragée ice cream sweet roll marzipan ice cream chocolate cake chocolate bar." +
              "Chocolate jelly pudding pastry gummi bears chocolate tootsie roll. Sweet candy canes jujubes. Topping chocolate bar macaroon tootsie roll. Oat cake jelly-o marshmallow caramels apple pie sesame snaps gummi bears jujubes." +
              "Topping pie pie chocolate bar. Brownie cupcake gingerbread jelly beans bonbon toffee toffee chocolate cheesecake. Gingerbread cookie cupcake gummies tart sweet. Tart jelly-o wafer donut." +
              "Toffee sweet roll croissant dessert chocolate cake. Croissant lemon drops ice cream topping halvah. Caramels candy canes halvah jelly-o halvah topping croissant tootsie roll. Icing donut macaroon danish lollipop." +
              "Tootsie roll bonbon sweet roll cookie. Gummies toffee cake sesame snaps sesame snaps bear claw dragée sesame snaps unerdwear.com. Croissant unerdwear.com jelly-o." +
              "Bear claw donut applicake chocolate cake powder fruitcake cheesecake icing. Marzipan marshmallow cake. Halvah chocolate bar chocolate cake fruitcake bear claw icing." +
              "Donut jujubes cake sweet dragée tootsie roll. Cake toffee tootsie roll gummi bears jelly-o marshmallow oat cake. Unerdwear.com chocolate soufflé jelly beans." +
              "Candy canes brownie sweet sweet chocolate cake chupa chups gummies sweet. Icing dragée chocolate cake topping applicake dragée bear claw candy canes. Chocolate pudding wafer gummies chocolate bar gummies macaroon." +
              "Chocolate bar pudding jelly-o candy canes tart. Candy canes tootsie roll tart icing bear claw bear claw biscuit.",
  
  postCollection = Db.collection('posts');

  postCollection.count(function(err, count) {
    titleBaseNumber = count+1;
  });

  Db.collection('users', function(err, theUsers) {
    theUsers.find().toArray(function(err, items) {
      users = items;

      for(var i=0; i<numberOfPostsToAdd; i++) {
        var title = "Post " + titleBaseNumber;
        var author = items[parseInt(Math.random() * items.length)];
        var date = new Date().getTime();
        titleBaseNumber++;
        postCollection.insert({title: title, body: body, avatar: "http://placehold.it/64x64", created: date, author_id:author._id, author: author.name}, {w:1}, function(err, item) {});
      }  
    });
  });
};