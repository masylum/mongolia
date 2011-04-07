var testosterone = require('testosterone')({post: 3000}),
    assert = testosterone.assert,

    Model = require('./../lib/model'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Server = mongodb.Server,

    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {}),

    User = function (db) {
      var user = Model(db, 'users');
      return user;
    },

    User = User(db),
    sys = require('sys'),

    load_user = function (callback) {
      remove_users();
      db.collection('users', function (error, collection) {
        collection.insert({name: 'Pau', email: 'pau@mongolia.com', password: 'pau123'}, function (error, doc) {
          callback(doc);
        });
      });
    },

    remove_users = function () {
      db.collection('users', function (error, collection) {
        collection.remove({}, function (error, bla) {});
      });
    };

db.open();

testosterone

  .add('Throws an error when there is no db', function (done) {
    assert.throws(function () {
        var model = Model(null);
      }, /You must specify a db/);
  })

  .add('Throws an error when collection is missing', function (done) {
    assert.throws(function () {
        var model = Model(db);
      }, /You must specify a collection name/);
  })

  .add('#getCollection returns a document collection', function (done) {
    User.getCollection(function (error, collection) {
      assert.equal(error, null);
      assert.equal(collection.collectionName, 'users');
    });
  })

  .add('#call findArray', function (done) {
    load_user(function (user) {
      var n = 0;

      User.mongoCall('findArray', {}, function (error, doc) {
        assert.deepEqual(doc, user);
        n += 1;
      });

      User.mongoCall('findArray', {name: 'Pau'}, function (error, doc) {
        assert.deepEqual(doc, user);
        n += 1;
      });

      User.mongoCall('findArray', {name: 'Zemba'}, function (error, doc) {
        assert.deepEqual(doc, []);
        n += 1;
      });
   
    });
  })

  .run(function () {
    require('sys').print('done!');
    db.close();
  });
