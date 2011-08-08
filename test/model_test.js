var testosterone = require('testosterone')({sync: true, title: 'mongolia/model.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Model = require('./../lib/model'),

    _db = {bson_serializer: {}},
    _mock_validator = function (ret) {
      return {
        hasErrors: function () {
          return ret;
        }
      };
    },
    User;

testosterone

  .before(function () {
    User = Model(_db, 'users');
  })

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

    gently.expect(_db, 'collection', function (_collection_name, _callback) {
      assert.equal(_collection_name, 'users');
      assert.equal(_callback, cb);
    });

    User.getCollection(cb);
  })

  .add('`mongo` proxies collection calls', function () {
    var callback = function (error, doc) {}
      , query = {name: 'zemba'};

    gently.expect(User.collection_proxy, 'proxy', function (_model, _options, _args, _callback) {
      assert.deepEqual(_options, {hooks: true, namespacing: true, mapping: true, method: 'findArray'});
      assert.deepEqual(_args[0], query);
      assert.equal(_callback, callback);
    });

    User.mongo('findArray', query, callback);
  })

  .add('`mongo` proxies namespaced collection calls', function () {
    var callback = function (error, doc) {}
      , query = {name: 'zemba'};

    gently.expect(User.collection_proxy, 'proxy', function (_model, _options, _args, _callback) {
      assert.deepEqual(_options, {
        hooks: true
      , namespacing: true
      , mapping: true
      , method: 'findArray'
      , namespace: 'public'
      });
      assert.deepEqual(_args[0], query);
      assert.equal(_callback, callback);
    });

    User.mongo('findArray:public', query, callback);
  })

  .add('`mongo` proxies with options', function () {
    var callback = function (error, doc) {}
      , query = {name: 'zemba'};

    gently.expect(User.collection_proxy, 'proxy', function (_model, _options, _args, _callback) {
      assert.deepEqual(_options, {
        hooks: false
      , namespacing: true
      , mapping: true
      , method: 'findArray'
      , namespace: 'public'
      });
      assert.deepEqual(_args[0], query);
      assert.equal(_callback, callback);
    });

    User.mongo({method: 'findArray', namespace: 'public', hooks: false}, query, callback);
  })

  .add('`mongo` can be called without a callback', function () {
    var query = {name: 'zemba'};

    gently.expect(User.collection_proxy, 'proxy', function (_model, _options, _args, _callback) {
      assert.deepEqual(_options, {
        hooks: true
      , namespacing: true
      , mapping: true
      , method: 'findArray'
      });
      assert.deepEqual(_args[0], query);
      assert.equal(typeof _args[_args.length - 1], 'function');
      assert.equal(typeof _callback, 'function');
    });

    User.mongo('findArray', query);
  })

  .add('`validate` validates a mongo document', function () {
    var document = {},
        update = {name: 'Pau'},
        validator = {data: 'foo'},
        callback;

    gently.hijacked['./validator'] = gently.expect(function (_document, _update) {
      assert.deepEqual(document, _document);
      assert.deepEqual(update, _update);
      return validator;
    });

    callback = gently.expect(function (_error, _validator) {
      assert.equal(_error, null);
      assert.deepEqual(validator, validator);
    });

    User.validate(document, update, callback);
  })

  .add('`validateAndInsert` when the model is invalid does not insert it', function () {
    var document = {},
        validator = _mock_validator(true),
        callback;

    gently.expect(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });

    callback = gently.expect(function (_error, _validator) {
      assert.equal(_error, null);
      assert.deepEqual(_validator, validator);
    });

    User.validateAndInsert(document, callback);
  })

  .add('`validateAndInsert` when the model is valid inserts it afterwards', function () {
    var document = {foo: 'bar'},
        validator = _mock_validator(false),
        callback;

    User.maps = {
      foo: function (el) {
        return el.toUpperCase();
      }
    };

    gently.expect(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });

    gently.expect(User, 'mongo', function (_action, _document, _callback) {
      assert.deepEqual(_action, {method: 'insert', namespacing: false, mapping: false});
      assert.deepEqual(_document.foo, 'BAR');
      _callback(null, _document);
    });

    callback = gently.expect(function (_error, _validator) {
      assert.equal(_error, null);
      assert.deepEqual(_validator, validator);
    });

    User.validateAndInsert(document, callback);
  })

  .add('`beforeInsert` default hook sets the created_at date', function () {
    var documents = [{name: 'zemba'}, {foo: 'bar'}];

    User.beforeInsert(documents, function (_error, _documents) {
      _documents.forEach(function (document) {
        assert.ok(document.created_at);
        assert.equal(document.created_at.constructor, (new Date()).constructor);
      });
    });
  })

  .add('`beforeUpdate` default hook updated the updated_at date', function () {
    var query = {foo: 'bar'},
        update = {'$set': {fleiba: 'zemba'}};

    User.beforeUpdate(query, update, function (error, _query, _update) {
      assert.ok(_update.$set);
      assert.ok(_update.$set.updated_at);
      assert.equal(_update.$set.updated_at.constructor, (new Date()).constructor);
    });
  })

  .add('`validateAndUpdate` when the model is invalid does not update it', function () {
    var query = {foo: 'bar'}
      , document = {foo: 'bar', fleiba: 'foo'}
      , update = {fleiba: 'zemba'}
      , validator = _mock_validator(true)
      , options = {}
      , callback;

    gently.expect(User, 'mongo', function (_method, _query, _callback) {
      assert.equal(_method, 'findOne');
      assert.deepEqual(_query, query);
      _callback(null, document);
    });

    gently.expect(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });

    callback = gently.expect(function (_error, _validator) {
      assert.equal(_error, null);
      assert.deepEqual(_validator, validator);
    });

    User.validateAndUpdate(query, update, options, callback);
  })

  .add('`validateAndUpdate` when the model is valid updates it afterwards', function () {
    var query = {foo: 'bar'}
      , document = {_id: '123', foo: 'bar'}
      , update = {'$set': {fleiba: 'John'}}
      , validator = _mock_validator(false)
      , options = {}
      , callback;

    User.maps = {
      fleiba: function (el) {
        return el.toLowerCase();
      }
    };

    gently.expect(User, 'mongo', function (_method, _query, _callback) {
      assert.equal(_method, 'findOne');
      assert.deepEqual(_query, query);
      _callback(null, document);
    });

    User.beforeUpdate = function (_query, _update, _callback) {
      _callback(null, document);
    };

    gently.expect(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });

    gently.expect(User, 'mongo', function (_action, _document, _update, _options, _callback) {
      assert.deepEqual(_action, {method: 'update', namespacing: false, mapping: false});
      assert.deepEqual(_document._id, document._id);
      assert.deepEqual(_update.$set.fleiba, 'john');
      assert.deepEqual(_options, options);
      _callback(null, _document);
    });

    callback = gently.expect(function (_error, _validator) {
      assert.equal(_error, null);
      assert.deepEqual(_validator, validator);
    });

    User.validateAndUpdate(query, update, options, callback);
  })

  .add('`getEmbeddedDocument` filters the document following the skeletons directive', function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};

    User.skeletons = {
      comment: ['_id', 'title']
    };

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo' });
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment'),
      {post: {comment: {_id: 1, title: 'foo'}}}
    );
  })

  .add('`getEmbeddedDocument` filters the document following recursive skeletons directives', function () {
    var post = {_id: 1, title: 'foo', body: 'Lorem ipsum', comment: {body: 'comment body!', created_at: Date.now()}};

    User.skeletons = {
      post: ['_id', 'title', 'comment.body']
    };

    assert.deepEqual(User.getEmbeddedDocument('post', post), {_id: 1, title: 'foo', comment: {body: 'comment body!'}});
    assert.deepEqual(
      User.getEmbeddedDocument('post', post, 'post'),
      {post: {_id: 1, title: 'foo', comment: {body: 'comment body!'}}}
    );
  })

  .add('`getEmbeddedDocument` returns appropiate `dot_notation` strings', function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};

    User.skeletons = {
      comment: ['_id', 'title']
    };

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), {_id: 1, title: 'foo'});
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post', true)
    , {'post._id': 1, 'post.title': 'foo'}
    );
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment', true),
      {'post.comment._id': 1, 'post.comment.title': 'foo'}
    );
  })

  .add('`getEmbeddedDocument` returns appropiate `dot_notation` strings using rescursive stuff', function () {
    var post = {_id: 1, title: 'foo', body: 'Lorem ipsum', comment: {body: 'comment body!', created_at: Date.now()}};

    User.skeletons = {
      post: ['_id', 'title', 'comment.body']
    };

    assert.deepEqual(
      User.getEmbeddedDocument('post', post, 'user.post', true),
      {'user.post._id': 1, 'user.post.title': 'foo', 'user.post.comment.body': 'comment body!'}
    );
  })

  .add('`getEmbeddedDocument` works without specifying the skeletons', function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};

    User.skeletons = null;

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo', body: 'Lorem ipsum'});
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment'),
      {post: {comment: comment}}
    );
  })

  .add('`updateEmbeddedDocument` updates embedded objects', function () {
    var embeddedDocument = {name: 'john', surname: 'snow', bo: 'vale'},
        options = {upsert: true},
        callback = function () {};

    User.skeletons = {
      author: ['_id', 'name', 'surname']
    };

    gently.expect(User, 'mongo', function (_opts, _query, _update, _options, _callback) {
      assert.deepEqual(_opts, {method: 'update', hooks: false});
      assert.deepEqual(_query, {'author._id': 1});
      assert.deepEqual(_update, {'$set': {'author.name': 'john', 'author.surname': 'snow'}});
      assert.deepEqual(_options, {upsert: true, multi: true});
      assert.equal(_callback, callback);
    });

    User.updateEmbeddedDocument({_id: 1}, 'author', embeddedDocument, options, callback);
  })

  .add('`pushEmbeddedDocument` pushes embedded objects', function () {
    var embeddedDocument = {name: 'john'},
        collection = {foo: 'bar'};

    gently.expect(User, 'getEmbeddedDocument', function (_name, _doc, _scope, _dot_notation) {
      assert.equal(_name, 'author');
      assert.deepEqual(_doc, embeddedDocument);
      assert.ifError(_scope);
      assert.ifError(_dot_notation);
      return embeddedDocument;
    });

    gently.expect(User, 'mongo', function (_opts, _query, _update, _options, _callback) {
      assert.deepEqual(_opts, {method: 'update', hooks: false});
      assert.deepEqual(_query, {_id: 1});
      assert.deepEqual(_update, {'$push': {author: embeddedDocument}});
      assert.deepEqual(_options, {upsert: false, multi: true});
    });

    User.pushEmbeddedDocument({_id: 1}, 'author', embeddedDocument);
  })

  .run();
