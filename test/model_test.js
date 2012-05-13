/*globals describe, beforeEach, it*/
var assert = require('assert')
  , sinon = require('sinon')
  , Model = require('./../lib/model')
  , Validator = require('./../lib/validator')

  , _db = {bson_serializer: {}, collection: function () {}}
  , _mock_validator = function (ret) {
      return {
        hasErrors: function () {
          return ret;
        }
      };
    }
  , User;

describe('Models', function () {

  beforeEach(function () {
    User = Model(_db, 'users');
  });

  it('`core` throws an error when there is no db', function () {
    assert.throws(function () {
      Model(null);
    }, 'You must specify a db');
  });

  it('`core` throws an error when collection is missing', function () {
    assert.throws(function () {
      Model(_db);
    }, 'You must specify a collection name');
  });

  it('`getCollection` returns a document collection', sinon.test(function () {
    var cb = function () {}
      , stub, self = this;

    stub = self.stub(_db, 'collection').withArgs('users', cb);

    User.getCollection(cb);
    sinon.assert.calledOnce(stub);
  }));

  it('`mongo` proxies collection calls', sinon.test(function () {
    var callback = function (error, doc) {}
      , stub, self = this
      , query = {name: 'zemba'};

    stub = self.stub(User.collection_proxy, 'proxy', function (_model, _options, _args) {
      assert.deepEqual(_options, {hooks: true, namespacing: true, mapping: true, method: 'findArray'});
      assert.deepEqual(_args[0], query);
      assert.deepEqual(_args[1], callback);
    });

    User.mongo('findArray', query, callback);
    sinon.assert.calledOnce(stub);
  }));

  it('`mongo` proxies namespaced collection calls', sinon.test(function () {
    var callback = function (error, doc) {}
      , stub, self = this
      , query = {name: 'zemba'};

    stub = self.stub(User.collection_proxy, 'proxy', function (_model, _options, _args) {
      assert.deepEqual(_options, {
        hooks: true
      , namespacing: true
      , mapping: true
      , method: 'findArray'
      , namespace: 'public'
      });
      assert.deepEqual(_args[0], query);
      assert.deepEqual(_args[1], callback);
    });

    User.mongo('findArray:public', query, callback);
    sinon.assert.calledOnce(stub);
  }));

  it('`mongo` proxies with options', sinon.test(function () {
    var callback = function (error, doc) {}
      , stub, self = this
      , query = {name: 'zemba'};

    stub = self.stub(User.collection_proxy, 'proxy', function (_model, _options, _args) {
      assert.deepEqual(_options, {
        hooks: false
      , namespacing: true
      , mapping: true
      , method: 'findArray'
      , namespace: 'public'
      });
      assert.deepEqual(_args[0], query);
      assert.deepEqual(_args[1], callback);
    });

    User.mongo({method: 'findArray', namespace: 'public', hooks: false}, query, callback);
    sinon.assert.calledOnce(stub);
  }));

  it('`validate` validates a mongo document', sinon.test(function () {
    var document = {}
      , self = this, stub
      , update = {name: 'Pau'}
      , validator = {data: 'foo'}
      , callback;

    stub = self.stub(User, 'validator').withArgs(document, update).returns(validator);
    callback = self.spy().withArgs(null, validator);

    User.validate(document, update, callback);
    sinon.assert.calledOnce(stub);
    sinon.assert.calledOnce(callback);
  }));

  it('`validateAndInsert` when the model is invalid does not insert it', sinon.test(function () {
    var document = {}
      , self = this, stub
      , validator = _mock_validator(true)
      , callback;

    stub = self.stub(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });
    callback = self.spy().withArgs(null, validator);

    User.validateAndInsert(document, callback);
    sinon.assert.calledOnce(stub);
    sinon.assert.calledOnce(callback);
  }));

  it('`validateAndInsert` when the model is valid inserts it afterwards', sinon.test(function () {
    var document = {foo: 'bar'}
      , self = this, stub1, stub2
      , validator = _mock_validator(false)
      , callback;

    User.maps = {
      foo: function (el) {
        return el.toUpperCase();
      }
    };

    stub1 = self.stub(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });

    stub2 = self.stub(User, 'mongo', function (_action, _document, _callback) {
      assert.deepEqual(_action, {method: 'insert', namespacing: false, mapping: false});
      assert.deepEqual(_document.foo, 'BAR');
      _callback(null, _document);
    });

    callback = self.spy().withArgs(null, validator);

    User.validateAndInsert(document, callback);
    sinon.assert.calledOnce(stub1);
    sinon.assert.calledOnce(stub2);
    sinon.assert.calledOnce(callback);
  }));

  it('`beforeInsert` default hook sets the created_at date', sinon.test(function () {
    var documents = [{name: 'zemba'}, {foo: 'bar'}];

    User.beforeInsert(documents, function (_error, _documents) {
      _documents.forEach(function (document) {
        assert.ok(document.created_at);
        assert.equal(document.created_at.constructor, (new Date()).constructor);
      });
    });
  }));

  it('`beforeUpdate` default hook updated the updated_at date', sinon.test(function () {
    var query = {foo: 'bar'}
      , update = {'$set': {fleiba: 'zemba'}};

    User.beforeUpdate(query, update, function (error, _query, _update) {
      assert.ok(_update.$set);
      assert.ok(_update.$set.updated_at);
      assert.equal(_update.$set.updated_at.constructor, (new Date()).constructor);
    });
  }));

  it('`validateAndUpdate` when the model is invalid does not update it', sinon.test(function () {
    var query = {foo: 'bar'}
      , self = this, stub1, stub2
      , document = {foo: 'bar', fleiba: 'foo'}
      , update = {fleiba: 'zemba'}
      , validator = _mock_validator(true)
      , options = {}
      , callback;

    stub1 = self.stub(User, 'mongo', function (_method, _query, _callback) {
      assert.equal(_method, 'findOne');
      assert.deepEqual(_query, query);
      _callback(null, document);
    });
    stub2 = self.stub(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });
    callback = self.spy().withArgs(null, validator);

    User.validateAndUpdate(query, update, options, callback);
    sinon.assert.calledOnce(stub1);
    sinon.assert.calledOnce(stub2);
    sinon.assert.calledOnce(callback);
  }));

  it('`validateAndUpdate` when the model is valid updates it afterwards', sinon.test(function () {
    var query = {foo: 'bar'}
      , self = this, stub1, stub2, stub3
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

    stub1 = self.stub(User, 'mongo', function (_method, _query, _callback) {
      assert.equal(_method, 'findOne');
      assert.deepEqual(_query, query);

      sinon.assert.calledOnce(stub1);
      stub1.restore();
      stub3 = self.stub(User, 'mongo', function (_action, _document, _update, _options, _callback) {
        assert.deepEqual(_action, {method: 'update', namespacing: false, mapping: false});
        assert.deepEqual(_document._id, document._id);
        assert.deepEqual(_update.$set.fleiba, 'john');
        assert.deepEqual(_options, options);
        _callback(null, _document);
      });

      _callback(null, document);
    });

    User.beforeUpdate = function (_query, _update, _callback) {
      _callback(null, document);
    };

    stub2 = self.stub(User, 'validate', function (_document, _data, _callback) {
      _callback(null, validator);
    });

    callback = self.spy().withArgs(null, validator);

    User.validateAndUpdate(query, update, options, callback);
    sinon.assert.calledOnce(stub2);
    sinon.assert.calledOnce(stub3);
    sinon.assert.calledOnce(callback);
  }));

  it('`getEmbeddedDocument` filters the document following the skeletons directive', sinon.test(function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};

    User.skeletons = {
      comment: ['_id', 'title']
    };

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo' });
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment')
    , {post: {comment: {_id: 1, title: 'foo'}}}
    );
  }));

  it('`getEmbeddedDocument` filters the document following recursive skeletons directives', sinon.test(function () {
    var post = {_id: 1, title: 'foo', body: 'Lorem ipsum', comment: {body: 'comment body!', created_at: Date.now()}};

    User.skeletons = {
      post: ['_id', 'title', 'comment.body']
    };

    assert.deepEqual(User.getEmbeddedDocument('post', post), {_id: 1, title: 'foo', comment: {body: 'comment body!'}});
    assert.deepEqual(
      User.getEmbeddedDocument('post', post, 'post')
    , {post: {_id: 1, title: 'foo', comment: {body: 'comment body!'}}}
    );
  }));

  it('`getEmbeddedDocument` returns appropiate `dot_notation` strings', sinon.test(function () {
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
      User.getEmbeddedDocument('comment', comment, 'post.comment', true)
    , {'post.comment._id': 1, 'post.comment.title': 'foo'}
    );
  }));

  it('`getEmbeddedDocument` returns appropiate `dot_notation` strings using rescursive stuff', sinon.test(function () {
    var post = {_id: 1, title: 'foo', body: 'Lorem ipsum', comment: {body: 'comment body!', created_at: Date.now()}};

    User.skeletons = {
      post: ['_id', 'title', 'comment.body']
    };

    assert.deepEqual(
      User.getEmbeddedDocument('post', post, 'user.post', true)
    , {'user.post._id': 1, 'user.post.title': 'foo', 'user.post.comment.body': 'comment body!'}
    );
  }));

  it('`getEmbeddedDocument` works without specifying the skeletons', sinon.test(function () {
    var comment = {_id: 1, title: 'foo', body: 'Lorem ipsum'};

    User.skeletons = null;

    assert.deepEqual(User.getEmbeddedDocument('comment', comment), { _id: 1, title: 'foo', body: 'Lorem ipsum'});
    assert.deepEqual(
      User.getEmbeddedDocument('comment', comment, 'post.comment')
    , {post: {comment: comment}}
    );
  }));

  it('`updateEmbeddedDocument` updates embedded objects', sinon.test(function () {
    var embeddedDocument = {name: 'john', surname: 'snow', bo: 'vale'}
      , self = this, stub
      , options = {upsert: true}
      , callback = function () {};

    User.skeletons = {
      author: ['_id', 'name', 'surname']
    };

    stub = self.stub(User, 'mongo', function (_opts, _query, _update, _options, _callback) {
      assert.deepEqual(_opts, {method: 'update', hooks: false});
      assert.deepEqual(_query, {'author._id': 1});
      assert.deepEqual(_update, {'$set': {'author.name': 'john', 'author.surname': 'snow'}});
      assert.deepEqual(_options, {upsert: true, multi: true});
      assert.equal(_callback, callback);
    });

    User.updateEmbeddedDocument({_id: 1}, 'author', embeddedDocument, options, callback);
    sinon.assert.calledOnce(stub);
  }));

  it('`pushEmbeddedDocument` pushes embedded objects', sinon.test(function () {
    var embeddedDocument = {name: 'john'}
      , self = this, stub1, stub2
      , collection = {foo: 'bar'};

    stub1 = self.stub(User, 'getEmbeddedDocument', function (_name, _doc, _scope, _dot_notation) {
      assert.equal(_name, 'author');
      assert.deepEqual(_doc, embeddedDocument);
      assert.ifError(_scope);
      assert.ifError(_dot_notation);
      return embeddedDocument;
    });

    stub2 = self.stub(User, 'mongo', function (_opts, _query, _update, _options, _callback) {
      assert.deepEqual(_opts, {method: 'update', hooks: false});
      assert.deepEqual(_query, {_id: 1});
      assert.deepEqual(_update, {'$push': {author: embeddedDocument}});
      assert.deepEqual(_options, {upsert: false, multi: true});
    });

    User.pushEmbeddedDocument({_id: 1}, 'author', embeddedDocument);
    sinon.assert.calledOnce(stub1);
    sinon.assert.calledOnce(stub2);
  }));
});
