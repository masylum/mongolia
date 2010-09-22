/**
 * Module dependencies.
 */

var Model = require('./../model'),
    Server = require('mongodb/connection').Server,
    Db = require('mongodb/db').Db,
    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {});

require('ext');

var UserClass = Model.extend({
  constructor: function (db) {
    Model.call(this, db, 'users');
  }
});
var User = new UserClass(db);

var inspect= require('eyes').inspector({
  styles: {                 // Styles applied to stdout
      all:     'yellow',    // Overall style applied to everything
      label:   'underline', // Inspection labels, like 'array' in `array: [1, 2, 3]`
      other:   'inverted',  // Objects which don't have a literal representation, such as functions
      key:     'bold',      // The keys in object literals, like 'a' in `{a: 1}`

      special: 'grey',      // null, undefined...
      string:  'green',
      number:  'red',
      bool:    'blue',      // true false
      regexp:  'green',     // /\d+/
  },
  maxLength: 9999999999
});

var load_user = function(callback){
  db.collection('users', function(error, collection) {
    collection.insert({name: 'Pau', email: 'pau@mongolia.com', password: 'pau123'}, function(error, doc){
      callback(doc);
      collection.remove({}, function(error, bla){});
    });
  });
}

var remove_users = function(callback){
  db.collection('users', function(error, collection) {
    collection.remove({}, callback);
  });
}

db.open(function(){
  exports['test get collection'] = function(assert){
    User.getCollection(function(error, collection){
      assert.equal(error, null);
      assert.equal(collection.collectionName, 'users');
    });
  };

   exports['test find Array'] = function(assert, beforeExit){
     load_user(function(user){
       var n = 0;
       User.mongoCall('findArray', {}, function(error, doc){
         assert.eql(doc, user);
         ++n;
       });

       User.mongoCall('findArray', {name: 'Pau'}, function(error, doc){
         assert.eql(doc, user);
         ++n;
       });

       User.mongoCall('findArray', {name: 'Zemba'}, function(error, doc){
         assert.eql(doc, []);
         ++n;
       });

       beforeExit(function(){
         assert.equal(3, n, 'All tests are run');
       });
     });
   };

  exports['test find'] = function(assert, beforeExit){
    load_user(function(user){
      var n = 0;

      User.mongoCall('find', {}, function(error, cursor){
        assert.eql(cursor.selector, {});
        assert.equal(cursor.queryRun, false);
        ++n;
      });

      User.mongoCall('find', {name: 'Pau'}, function(error, cursor){
        assert.eql(cursor.selector, {name: 'Pau'});
        assert.equal(cursor.queryRun, false);
        ++n;
      });

      User.mongoCall('find', {name: 'Zemba'}, function(error, cursor){
        assert.eql(cursor.selector, {name: 'Zemba'});
        assert.equal(cursor.queryRun, false);
        ++n;
      });

      beforeExit(function(){
        assert.equal(3, n, 'All tests are run');
      });
    });
  };

  exports['test insert'] = function(assert, beforeExit){
    var n = 0;

    User.onCreate = function(element){
      element.foo = 'bar';
    };

    User.mongoCall('insert', {name: 'Zemba'}, function(error, docs){
      assert.eql(docs, {name: 'Zemba', foo: 'bar'});
      ++n;
    });

    beforeExit(function(){
      assert.equal(1, n, 'All tests are run');
      remove_users();
    });
  };
});
