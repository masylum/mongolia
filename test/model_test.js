var testosterone = require('testosterone')({sync: true, title: 'mongolia/model.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Model = require('./../lib/model'),
    CollectionProxy = require('./../lib/helpers/collection_proxy'),

    _db = {},
    _mock_validator = function (ret) {
      return {
        hasErrors: function () {
          return ret;
        }
      };
    },

    User = (function (db) {
      var user = Model(db, 'users');
      return user;
    }(_db));

testosterone

  .add('`core` throws an error when there is no db', function () {
    assert.throws(function () {
      Model(null);
    }, 'You must specify a db');
  })

  .add('`core` throws an error when collection is missing', function () {
    assert.throws(function () {
      Model(_db);
    }, 'You must specify a collection name');
  })

  .add('`getCollection` returns a document collection', function () {
    var cb = function (error, collection) {};

    gently.expect(_db, 'collection', function (collection_name, callback) {
      assert.equal(collection_name, 'users');
      assert.equal(callback, cb);
    });

    User.getCollection(cb);
  })

  .add('`mongo proxies` collection calls', function () {
    var cb = function (error, doc) {},
        query = {name: 'Pau'},
        coll = {collectionName: 'users'};

    gently.expect(_db, 'collection', function (collection_name, callback) {
      callback(null, coll);
    });

    gently.expect(CollectionProxy, 'proxy', function (model, fn, collection, args, callback) {
      assert.equal(fn, 'findArray');
      assert.deepEqual(collection, coll);
      assert.deepEqual(args[0], query);
      assert.equal(callback, cb);
    });

    User.mongo('findArray', query, cb);
  })

  .add('`validate` validates a mongo document', function () {
    var document = {},
        data = {name: 'Pau'},
        callback_called = false,

        callback = function (error, validator) {
          callback_called = true;
          assert.equal(error, null);
          assert.deepEqual(validator.data, data);
        };

    User.validate(document, data, callback);
    assert.ok(callback_called, 'Model#validate never called the callback');
  })

  .add('`validateAndInsert` when the model is invalid does not insert it', function () {
    var document = {},
        callback_called = false,
        cb = function (error, validator) {
          callback_called = true;
        };

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(true));
    });

    gently.expect(User, 'mongo', 0);

    User.validateAndInsert(document, cb);
    assert.ok(callback_called, 'Model#validateAndInsert never called the callback');
  })

  .add('`validateAndInsert` when the model is valid inserts it afterwards', function () {
    var document = {},
        callback_called = false,
        cb = function (error, validator) {
          callback_called = true;
        };

    User.onCreate = function (document, callback) {
      callback(null, document);
    };

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(false));
    });

    gently.expect(User, 'mongo', function (action, document, callback) {
      assert.equal(action, 'insert');
      callback(null, document);
    });

    User.validateAndInsert(document, cb);
    assert.ok(callback_called, 'Model#validateAndInsert never called the callback');
  })

  .add('`beforeCreate` default hook sets the created_at date and runs the callback', function () {
    var document = {},
        callback_called = false;

    User.beforeCreate(document, function () {
      // Ensure #created_at is a Date
      assert.ok(document.created_at, 'Model#beforeCreate should set document#created_at to be a Date');
      assert.equal(document.created_at.constructor, (new Date()).constructor);
      callback_called = true;
    });

    assert.ok(callback_called, 'Model#afterCreate never called the callback');
  })

  .add('`afterCreate` default hook just runs the callback', function () {
    var document = {},
        callback_called = false;

    User.afterCreate(document, function () {
      callback_called = true;
    });

    assert.ok(callback_called, 'Model#afterCreate never called the callback');
  })

  .add('`beforeUpdate` default hook updated the updated_at date and runs the callback', function () {
    var update = {},
        callback_called = false;

    User.beforeUpdate(update, function () {
      // Ensure #created_at is a Date
      assert.ok(update.$set && update.$set.updated_at, 'Model#beforeUpdate should set update#updated_at to be a Date');
      assert.equal(update.$set.updated_at.constructor, (new Date()).constructor);
      callback_called = true;
    });

    assert.ok(callback_called, 'Model#afterUpdate never called the callback');
  })

  .add('`afterUpdate` default hook just runs the callback', function () {
    var update = {},
        callback_called = false;

    User.afterUpdate(update, function () {
      callback_called = true;
    });

    assert.ok(callback_called, 'Model#afterUpdate never called the callback');
  })

  .add('`beforeRemove` default hook just runs the callback', function () {
    var document = {},
        callback_called = false;

    User.beforeRemove(document, function () {
      callback_called = true;
    });

    assert.ok(callback_called, 'Model#beforeRemove never called the callback');
  })

  .add('`afterRemove` default hook just runs the callback', function () {
    var document = {},
        callback_called = false;

    User.afterRemove(document, function () {
      callback_called = true;
    });

    assert.ok(callback_called, 'Model#afterRemove never called the callback');
  })

  .add('`validateAndUpdate` when the model is invalid does not update it', function () {
    var document = {},
        update = {},
        options = {},
        callback_called = false,
        cb = function (error, validator) {
          callback_called = true;
        };

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(true));
    });

    gently.expect(User, 'mongo', 0);

    User.validateAndUpdate(document, update, options, cb);
    assert.ok(callback_called, 'Model#validateAndUpdate never called the callback');
  })

  .add('`validateAndUpdate` when the model is valid updates it afterwards', function () {
    var document = {},
        update = {},
        options = {},
        callback_called = false,
        cb = function (error, validator) {
          callback_called = true;
        };

    User.onUpdate = function (document, update, callback) {
      callback(null, document);
    };

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(false));
    });

    gently.expect(User, 'mongo', function (action, document, update, options, callback) {
      assert.equal(action, 'update');
      callback(null, document);
    });

    User.validateAndUpdate(document, update, options, cb);
    assert.ok(callback_called, 'Model#validateAndUpdate never called the callback');
  })

  .add('`getEmbeddedDocument` filters the document following the skeletons directive', function () {
    var comment = {'_id': 1, title: 'foo', body: 'Lorem ipsum'};
    User.skeletons = {
      comment: ['_id', 'title']
    };

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo' });
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment'),
      { 'post.comment._id': 1, 'post.comment.title': 'foo' }
    );
  })

  .add('`updateEmbeddedDocument` updates an embedded object', function () {
    var embeddedDocument = {},
        opts = {},
        cb = function () {};

    gently.expect(User, 'getEmbeddedDocument', function () {
      return embeddedDocument;
    });

    gently.expect(User, 'mongo', function (action, query, update, options, callback) {
      assert.equal(action, 'update');
      assert.deepEqual(query, {'author._id': 1});
      assert.deepEqual(update, {'$set': embeddedDocument});
      assert.equal(options, opts);
      assert.equal(callback, cb);
    });

    User.updateEmbeddedDocument(1, 'author', {}, opts, cb);
  })

  .add('`pushEmbeddedDocument` pushes an embedded object', function () {
    var embeddedDocument = {},
        opts = {},
        cb = function () {};

    gently.expect(User, 'getEmbeddedDocument', function () {
      return embeddedDocument;
    });

    gently.expect(User, 'mongo', function (action, query, update, options, callback) {
      assert.equal(action, 'update');
      assert.deepEqual(query, {'author._id': 1});
      assert.deepEqual(update, {'$push': embeddedDocument});
      assert.equal(options, opts);
      assert.equal(callback, cb);
    });

    User.pushEmbeddedDocument(1, 'author', {}, opts, cb);
  })

  .run(function () {
    // zemba
  });
