var self = this;

this.app = require('./app');
this.mongo = require('mongodb').MongoClient;
this.ObjectID = require('mongodb').ObjectID;
this.Db = require('mongodb').Db;
this.Server = require('mongodb').Server;
this.Connection = require('mongodb').Connection;
this.dbURL = 'mongodb://127.0.0.1/angular-data';

this.host = 'localhost';
this.port = this.Connection.DEFAULT_PORT;
this.db = new this.Db('angular-data', new self.Server(self.host, self.port, {}), {native_parser:false, w:1});
this.BSON = this.mongo.BSONPure;

// Open the DB
this.db.open(function(err, db) {
  if(err) {
    self.app.goForLaunch(false, err)
  } else {
    self.app.goForLaunch(true)
  }
});

return this;