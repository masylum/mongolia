/**
 * Module dependencies.
 */

var Model = require('./../lib/model'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Server = mongodb.Server,
    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {});

var User = function (db) {
      var user = Model(db, 'users');
      return user;
    },

    User = User(db),

    load_user = function (callback) {
      db.collection('users', function (error, collection) {
        collection.insert({name: 'Pau', email: 'pau@mongolia.com', password: 'pau123'}, function (error, doc) {
          callback(doc);
          collection.remove({}, function (error, bla) {});
        });
      });
    },

    remove_users = function () {
      db.collection('users', function (error, collection) {
        collection.remove({}, function (error, bla) {});
      });
    };


db.open(function () {
  module.exports['test get collection'] = function (assert) {
    User.getCollection(function (error, collection) {
      assert.equal(error, null);
      assert.equal(collection.collectionName, 'users');
    });
  };

  module.exports['test find Array'] = function (assert, beforeExit) {
    load_user(function (user) {
      var n = 0;
      User.mongoCall('findArray', {}, function (error, doc) {
        assert.eql(doc, user);
        n += 1;
      });

      User.mongoCall('findArray', {name: 'Pau'}, function (error, doc) {
        assert.eql(doc, user);
        n += 1;
      });

      User.mongoCall('findArray', {name: 'Zemba'}, function (error, doc) {
        assert.eql(doc, []);
        n += 1;
      });

      beforeExit(function () {
        assert.equal(3, n, 'All tests are run');
      });
    });
  };

  module.exports['test find'] = function (assert, beforeExit) {
    load_user(function (user) {
      var n = 0;

      User.mongoCall('find', {}, function (error, cursor) {
        assert.eql(cursor.selector, {});
        assert.equal(cursor.queryRun, false);
        n += 1;
      });

      User.mongoCall('find', {name: 'Pau'}, function (error, cursor) {
        assert.eql(cursor.selector, {name: 'Pau'});
        assert.equal(cursor.queryRun, false);
        n += 1;
      });

      User.mongoCall('find', {name: 'Zemba'}, function (error, cursor) {
        assert.eql(cursor.selector, {name: 'Zemba'});
        assert.equal(cursor.queryRun, false);
        n += 1;
      });

      beforeExit(function () {
        assert.equal(3, n, 'All tests are run');
      });
    });
  };

  module.exports['test insert'] = function (assert, beforeExit) {
    var n = 0;

    User.onCreate = function (element) {
      element.foo = 'bar';
    };

    User.afterCreate = function (element) {
      element._id = 'forlayo';
    };

    User.mongoCall('insert', {name: 'Zemba'}, function (error, docs) {
      assert.equal(docs[0].name, 'Zemba');
      assert.equal(docs[0].foo, 'bar');
      assert.equal(docs[0]._id, 'forlayo');
      n += 1;
    });

    User.mongoCall('insert', [{name: 'Zemba'}, {name: 'Fleiba'}], function (error, docs) {
      assert.equal(docs[0].name, 'Zemba');
      assert.equal(docs[0].foo, 'bar');
      assert.equal(docs[0]._id, 'forlayo');
      assert.equal(docs[1].name, 'Fleiba');
      assert.equal(docs[1].foo, 'bar');
      assert.equal(docs[1]._id, 'forlayo');
      n += 1;
    });

    beforeExit(function () {
      assert.equal(2, n, 'All tests are run');
      remove_users();
    });
  };
});
