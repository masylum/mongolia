var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/collection_proxy.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),
    CollectionProxy = require('./../../lib/helpers/collection_proxy'),
    Collection = require('mongodb/lib/mongodb/collection').Collection.prototype,
    Model;

function _stubGetCollection() {
  gently.expect(Model, 'getCollection', function (_callback) {
    _callback(null, Collection);
  });
}

testosterone
  .before(function () {
    Model = require('../../').model({}, 'models');
  })

  .add('`proxy` delegates every call to collection_proxy or native driver collection functions', function () {
    var cb = function cb() {},
        args = ['zemba', cb];

    ['update', 'insert', 'findArray'].forEach(function (method) {
      _stubGetCollection();
      gently.expect(CollectionProxy, method, function (_model, _collection, _args, _callback) {
        assert.equal(Model, _model);
        assert.equal(Collection, _collection);
        assert.deepEqual(args, _args);
        assert.equal(cb, _callback);
      });

      CollectionProxy.proxy(Model, {method: method, hooks: true}, args, cb);
    });

    ['find', 'foo', 'update', 'insert', 'findArray'].forEach(function (method) {
      _stubGetCollection();
      gently.expect(Collection, method, function (_arg, _callback) {
        assert.equal(_arg, args[0]);
        assert.deepEqual(_callback, args[1]);
      });

      CollectionProxy.proxy(Model, {method: method, hooks: false}, args, cb);
    });
  })

  .add('`proxy` modifies the arguments according to `namespaces` unless the `namespacing` option is set to `false`', function () {
    var cb = function () {},
        args = [{foo: 'bar'}, cb];

    Model.namespaces = {
      foo: ['zemba', 'fleiba']
    };

    // namespacing: true
    _stubGetCollection();
    gently.expect(CollectionProxy.namespacer, 'filter', function (_namespaces, _namespace, _fn, _args) {
      assert.deepEqual(_namespaces, Model.namespaces);
      assert.deepEqual(_namespace, 'foo');
      assert.equal(_fn, 'find');
      assert.deepEqual(_args, args);
    });

    gently.expect(Collection, 'find', function (_arg, _callback) {
      assert.equal(_arg, args[0]);
      assert.deepEqual(_callback, args[1]);
    });

    CollectionProxy.proxy(Model, {method: 'find', namespace: 'foo', namespacing: true}, args, cb);

    // namespacing: false
    _stubGetCollection();
    gently.expect(Collection, 'find', function (_arg, _callback) {
      assert.equal(_arg, args[0]);
      assert.deepEqual(_callback, args[1]);
    });

    CollectionProxy.proxy(Model, {method: 'find', namespace: 'foo', namespacing: false}, args, cb);
  })

  .add('`proxy` maps the arguments according to `maps` unless the `mapping` option is set to `false`', function () {
    var cb = function () {},
        args = [{foo: 'bar', _id: '3'}, cb];

    Model.maps = {foo: Boolean};

    _stubGetCollection();
    gently.expect(CollectionProxy.mapper, 'map', function (_maps, _fn, _args) {
      assert.deepEqual(_maps, {foo: Boolean});
      assert.equal(_fn, 'find');
      assert.deepEqual(_args, args);
    });

    gently.expect(Collection, 'find', function (_arg, _callback) {
      assert.equal(_arg, args[0]);
      assert.deepEqual(_callback, args[1]);
    });

    CollectionProxy.proxy(Model, {method: 'find', mapping: true}, args, cb);

    _stubGetCollection();
    gently.expect(Collection, 'find', function (_arg, _callback) {
      assert.equal(_arg, args[0]);
      assert.deepEqual(_callback, args[1]);
    });

    CollectionProxy.proxy(Model, {method: 'find', mapping: false}, args, cb);
  })

  .add('`proxy` can be called with no callback', function () {
    var args = ['zemba'];

    ['update', 'insert', 'findArray'].forEach(function (method) {
      _stubGetCollection();
      gently.expect(CollectionProxy, method, function (_model, _collection, _args, _callback) {
        assert.equal(_model, Model);
        assert.equal(_collection, Collection);
        assert.deepEqual(_args, args);
        assert.equal(typeof _callback, 'function');
      });

      CollectionProxy.proxy(Model, {method: method, hooks: true}, args);
    });

    ['find', 'foo', 'update', 'insert', 'findArray'].forEach(function (method) {
      _stubGetCollection();
      gently.expect(Collection, method, function (_arg, _callback) {
        assert.equal(_arg, args[0]);
        assert.deepEqual(_callback, args[1]);
      });

      CollectionProxy.proxy(Model, {method: method, hooks: false}, args);
    });
  })

  .add('`findArray` calls find on a collection with some arguments', function () {
    var cb = function (error, cursor) {},
        cursor = {fleiba: 'zemba'},
        error_result = null,
        args = ['fleiba', cb];

    gently.expect(Collection, 'find', function (_collection, _args) {
      assert.deepEqual(_collection, args[0]);
      gently.expect(cursor, 'toArray');
      args[args.length - 1](null, cursor);
    });

    CollectionProxy.findArray(Model, Collection, args, cb);
  })

  .add('`insert` inserts a record', function () {
    var callback_called = false,
        cb = function (error, ret) {
          assert.deepEqual(error, null);
          assert.deepEqual(ret, [1, 2, 3]);
          callback_called = true;
        },
        args = ['fleiba', cb];

    gently.expect(Model, 'beforeInsert', function (ar, callback) {
      assert.deepEqual(ar, args[0]);

      gently.expect(Collection.insert, 'apply', function (_collection, _args) {
        assert.deepEqual(_collection, Collection);
        assert.deepEqual(_args[0], ['document1', 'document2']);

        gently.expect(Model, 'afterInsert', function (_docs, _callback) {
          assert.deepEqual(_docs, ['document1', 'document2']);
          _callback(null);
          assert.ok(callback_called);
        });

        _args[1](null, [1, 2, 3]);
      });

      callback(null, ['document1', 'document2']);
    });

    CollectionProxy.insert(Model, Collection, args, cb);
  })

  .add('`update` finds and modifies a record', function () {
    var callback_called = false,
        cb = function (error, ret) {
          assert.deepEqual(error, null);
          assert.deepEqual(ret, [1, 2, 3]);
          callback_called = true;
        },
        args = [{name: 'zemba'}, {'$set': {name: 'foo'}}, {}, cb];

    gently.expect(Model, 'beforeUpdate', function (_query, _update, _callback) {
      assert.deepEqual(_query, args[0]);
      assert.deepEqual(_update, args[1]);
      _update.$set.updated_at = 123;

      gently.expect(Collection.update, 'apply', function (_collection, _args) {
        assert.deepEqual(_collection, Collection);
        assert.deepEqual(_args[0], args[0]);
        assert.deepEqual(_args[1].$set.updated_at, 123);

        gently.expect(Model, 'afterUpdate', function (_doc, _update, _callback) {
          assert.deepEqual(_doc, args[0]);
          assert.deepEqual(_update, args[1]);
          _callback(null);
          assert.ok(callback_called);
        });

        _args[3](null, [1, 2, 3]);
      });

      _callback(null, _query, _update);
    });

    CollectionProxy.update(Model, Collection, args, cb);
  })

  .add('`findAndModify` finds and modifies a record', function () {
    var callback_called = false,
        cb = function (error, ret) {
          assert.deepEqual(error, null);
          assert.deepEqual(ret, [1, 2, 3]);
          callback_called = true;
        },
        args = [{name: 'zemba'}, [], {'$set': {name: 'foo'}}, {}, cb];

    gently.expect(Model, 'beforeUpdate', function (_query, _update, _callback) {
      assert.deepEqual(_query, args[0]);
      assert.deepEqual(_update, args[2]);
      _update.$set.updated_at = 123;

      gently.expect(Collection.findAndModify, 'apply', function (_collection, _args) {
        assert.deepEqual(_collection, Collection);
        assert.deepEqual(_args[0], args[0]);
        assert.deepEqual(_args[2].$set.updated_at, 123);

        gently.expect(Model, 'afterUpdate', function (_doc, _update, _callback) {
          assert.deepEqual(_doc, args[0]);
          assert.deepEqual(_update, args[2]);
          _callback(null);
          assert.ok(callback_called);
        });

        _args[4](null, [1, 2, 3]);
      });

      _callback(null, _query, _update);
    });

    CollectionProxy.findAndModify(Model, Collection, args, cb);
  })

  .add('`mapReduceCursor` calls `mapReduce` returning a cursor', function () {
    var args = ['a', 'b'],
        coll = {foo: 'bar'};

    [null, 'could not access the DB'].forEach(function (error) {
      var cb = null;

      gently.expect(Collection.mapReduce, 'apply', function (_collection, _args) {
        assert.equal(_collection, Collection);
        assert.equal(_args, args);

        if (!error) {
          gently.expect(coll, 'find', function (callback) {
            assert.ok(callback);
          });
        }

        _args[1](error, coll);
      });

      // TODO: Refactor this test
      if (error) {
        cb = gently.expect(function (_err, _coll) {
          assert.equal(_err, error);
          assert.equal(_coll, null);
        });
      } else {
        cb = function () {};
      }

      CollectionProxy.mapReduceCursor(Model, Collection, args, cb);
    });
  })

  .add('`mapReduceArray` returns a `mapReduceCursor` to Array', function () {
    var cb = function () {},
        args = ['fleiba', cb],
        cursor = {};

    gently.expect(CollectionProxy, 'mapReduceCursor', function (_model, _collection, _args, _callback) {
      assert.equal(_model, Model);
      assert.equal(_collection, Collection);
      assert.equal(_args, args);

      gently.expect(cursor, 'toArray', function (_callback) {
        assert.equal(_callback, cb);
      });

      _callback(null, cursor);
    });

    CollectionProxy.mapReduceArray(Model, Collection, args, cb);
  })

  .add('`remove` removes a document', function () {
    var callback_called = false,
        cb = function (error, ret) {
          assert.deepEqual(error, null);
          assert.deepEqual(ret, [1, 2, 3]);
          callback_called = true;
        },
        args = ['fleiba', cb];

    gently.expect(Model, 'beforeRemove', function (_query, _callback) {
      assert.deepEqual(_query, args[0]);

      gently.expect(Collection.remove, 'apply', function (_collection, _args) {
        assert.deepEqual(Collection, _collection);
        assert.deepEqual(_args[0], args[0]);

        gently.expect(Model, 'afterRemove', function (_query, _callback) {
          assert.deepEqual(_query, args[0]);
          _callback(null);
          assert.ok(callback_called);
        });

        _args[1](null, [1, 2, 3]);
      });

      _callback(null, _query);
    });

    CollectionProxy.remove(Model, Collection, args, cb);
  })

  .run();
