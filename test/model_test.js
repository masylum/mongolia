var testosterone = require('testosterone')({post: 3000, sync: true}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Model = require('./../lib/model'),
    collection_proxy = require('./../lib/helpers/collection_proxy'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Server = mongodb.Server,

    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {}),

    User = function (db) {
      var user = Model(db, 'users');
      return user;
    },

    User = User(db),
    sys = require('sys')

testosterone

  .add('Throws an error when there is no db', function () {
    assert.throws(function () {
        var model = Model(null);
      }, /You must specify a db/);
  })

  .add('Throws an error when collection is missing', function () {
    assert.throws(function () {
        var model = Model(db);
      }, /You must specify a collection name/);
  })

  .add('#getCollection returns a document collection', function () {
    cb = function (error, collection) {};
    gently.expect(db, 'collection', function (collection_name, callback) {
       assert.equal(collection_name, 'users');
       assert.equal(callback, cb);
    });

    User.getCollection(cb);
  })

  .add('#mongo proxies `collection` calls', function () {
    cb = function (error, doc) {};

    gently.expect(db, 'collection', function (collection_name, callback) {
      callback(undefined, {collectionName: 'users'});
    });
    gently.expect(collection_proxy, 'proxy', function (fn, collection, args, callback) {
      assert.equal(fn, 'findArray');
      assert.equal(collection.collectionName, 'users');
      assert.deepEqual(args[0], {"name":"Pau"});
      assert.equal(callback, cb);
    });

    User.mongo('findArray', {name: 'Pau'}, cb);
  })

  .add('#validate validates a mongo document', function () {
    document = {};
    data = {name:'Pau'};
    var callback_called = false;

    callback = function (error, validator) {
      callback_called = true;
      assert.equal(error, null);
      assert.deepEqual(validator.data, {name:'Pau'}) ;
    };

    User.validate(document, data, callback);
    assert.ok(callback_called, 'Model#validate never called the callback');
  })

  .add('#validateAndInsert when the model is invalid does not insert it', function () {
    document = {};
    var callback_called = false,
        cb = function (error, validator) { callback_called = true; }

    gently.expect(User, 'validate', function (document, data, callback) {
      validator = {
        hasErrors: function () { return true; }
      };
      callback(null, validator);
    });

    gently.expect(User, 'mongo', 0)
  
    User.validateAndInsert(document, cb);
    assert.ok(callback_called, 'Model#validateAndInsert never called the callback');
  })

  .add('#validateAndInsert when the model is valid inserts it afterwards', function () {
    document = {};
    var callback_called = false,
        cb = function (error, validator) { callback_called = true; }

    User.onCreate = function (document, callback) {
      callback(null, document);
    };

    gently.expect(User, 'validate', function (document, data, callback) {
      validator = {
        hasErrors: function () { return false; }
      };
      callback(null, validator);
    });

    gently.expect(User, 'mongo', function (action, document, callback) {
      assert.equal(action, 'insert');
      callback(null, document);
    });
  
    User.validateAndInsert(document, cb);
    assert.ok(callback_called, 'Model#validateAndInsert never called the callback');
  })

  .add('#beforeCreate default hook sets the created_at date and runs the callback', function () {
    document = {};
    var callback_called = false;

    User.beforeCreate(document, function() {
      // Ensure #created_at is a Date
      assert.ok(document.created_at && document.created_at.constructor.toString().match(/Date/)!==null,
        'Model#beforeCreate should set document#created_at to be a Date');
      callback_called = true; 
    })

    assert.ok(callback_called, 'Model#afterCreate never called the callback');
  })

  .add('#afterCreate default hook just runs the callback', function () {
    document = {};
    var callback_called = false;

    User.afterCreate(document, function() {
      callback_called = true; 
    })

    assert.ok(callback_called, 'Model#afterCreate never called the callback');
  })

  .add('#beforeUpdate default hook updated the updated_at date and runs the callback', function () {
    document = {};
    var callback_called = false;

    User.beforeUpdate(document, function() {
      // Ensure #created_at is a Date
      assert.ok(document.$set && document.$set.updated_at && document.$set.updated_at.constructor.toString().match(/Date/)!==null,
        'Model#beforeUpdate should set update#updated_at to be a Date');
      callback_called = true; 
    })

    assert.ok(callback_called, 'Model#afterUpdate never called the callback');
  })

  .add('#afterUpdate default hook just runs the callback', function () {
    document = {};
    var callback_called = false;

    User.afterUpdate(document, function() {
      callback_called = true; 
    })

    assert.ok(callback_called, 'Model#afterUpdate never called the callback');
  })

  .add('#beforeRemove default hook just runs the callback', function () {
    document = {};
    var callback_called = false;

    User.beforeRemove(document, function() {
      callback_called = true; 
    })

    assert.ok(callback_called, 'Model#beforeRemove never called the callback');
  })

  .add('#afterRemove default hook just runs the callback', function () {
    document = {};
    var callback_called = false;

    User.afterRemove(document, function() {
      callback_called = true; 
    })

    assert.ok(callback_called, 'Model#afterRemove never called the callback');
  })


  .run(function () {
    require('sys').print('done!');
  });
