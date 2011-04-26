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

  .add('`mongo` proxies collection calls', function () {
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

  .add('`mongo` can be called without a callback', function () {
    var query = {name: 'Pau'},
        coll = {collectionName: 'users'};

    gently.expect(_db, 'collection', function (collection_name, callback) {
      callback(null, coll);
    });

    gently.expect(CollectionProxy, 'proxy', function (model, fn, collection, args, callback) {
      assert.equal(fn, 'findArray');
      assert.deepEqual(collection, coll);
      assert.deepEqual(args[0], query);
      assert.equal(typeof callback, 'function');
    });

    User.mongo('findArray', query);
  })

  .add('`validate` validates a mongo document', function () {
    var document = {},
        data = {name: 'Pau'},

        callback = gently.expect(function (error, validator) {
          assert.equal(error, null);
          assert.deepEqual(validator.data, data);
        });

    User.validate(document, data, callback);
  })

  .add('`validateAndInsert` when the model is invalid does not insert it', function () {
    var document = {}, cb;

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(true));
    });
    gently.expect(User, 'mongo', 0);

    User.validateAndInsert(document, gently.expect(function () {}));
  })

  .add('`validateAndInsert` when the model is valid inserts it afterwards', function () {
    var document = {};

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

    User.validateAndInsert(document, gently.expect(function () {}));
  })

  .add('`beforeCreate` default hook sets the created_at date and runs the callback', function () {
    var documents = [{name: 'zemba'}, {foo: 'bar'}];

    User.beforeCreate(documents, gently.expect(function () {
      // Ensure #created_at is a Date
      documents.forEach(function (document) {
        assert.ok(document.created_at, 'Model#beforeCreate should set document#created_at to be a Date');
        assert.equal(document.created_at.constructor, (new Date()).constructor);
      });
    }));
  })

  .add('`afterCreate` default hook just runs the callback', function () {
    var documents = [{name: 'zemba'}, {foo: 'bar'}];

    User.afterCreate(documents, gently.expect(function () {}));
  })

  .add('`beforeUpdate` default hook updated the updated_at date and runs the callback', function () {
    var update = {};

    User.beforeUpdate(update, gently.expect(function () {
      // Ensure #created_at is a Date
      assert.ok(update.$set && update.$set.updated_at, 'Model#beforeUpdate should set update#updated_at to be a Date');
      assert.equal(update.$set.updated_at.constructor, (new Date()).constructor);
    }));
  })

  .add('`afterUpdate` default hook just runs the callback', function () {
    var update = {};
    User.afterUpdate(update, gently.expect(function () {}));
  })

  .add('`beforeRemove` default hook just runs the callback', function () {
    var document = {};
    User.beforeRemove(document, gently.expect(function () {}));
  })

  .add('`afterRemove` default hook just runs the callback', function () {
    var document = {};
    User.afterRemove(document, gently.expect(function () {}));
  })

  .add('`validateAndUpdate` when the model is invalid does not update it', function () {
    var document = {},
        update = {},
        options = {};

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(true));
    });
    gently.expect(User, 'mongo', 0);

    User.validateAndUpdate(document, update, options, gently.expect(function () {}));
  })

  .add('`validateAndUpdate` when the model is valid updates it afterwards', function () {
    var document = {name: 'Pau', email: 'zemba@foobar.com'},
        update = {name: 'John'},
        options = {};

    User.onUpdate = function (document, update, callback) {
      callback(null, document);
    };

    gently.expect(User, 'validate', function (document, data, callback) {
      callback(null, _mock_validator(false));
    });

    gently.expect(User, 'mongo', function (action, _document, _update, _options, callback) {
      assert.equal(action, 'update');
      assert.equal(_update, update);
      callback(null, document);
    });

    User.validateAndUpdate(document, update, options, gently.expect(function () {}));
  })

  .add('`getEmbeddedDocument` filters the document following the skeletons directive', function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};
    User.skeletons = {
      comment: ['_id', 'title']
    };

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo' });
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment'),
      {'post.comment._id': 1, 'post.comment.title': 'foo'}
    );
  })

  .add('`getEmbeddedDocument` works without specifying the skeletons', function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};
    User.skeletons = null;

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo', body: 'Lorem ipsum'});
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment'),
      {'post.comment._id': 1, 'post.comment.title': 'foo', 'post.comment.body': 'Lorem ipsum'}
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
