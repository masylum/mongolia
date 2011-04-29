var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/collection_proxy.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),
    Collection,

    _model = {};

testosterone

  .before(function () {
    Collection = require('./../../lib/helpers/collection_proxy')();
  })

  .add('`proxy` delegates every call to a function of Collection or native driver collection', function () {
    var coll = {foo: 'bar'},
        cb = function () {},
        args = ['zemba', cb];

    ['update', 'insert', 'findArray'].forEach(function (method) {
      gently.expect(Collection, method, function (model, collection, ar, cb) {
        assert.equal(model, _model);
        assert.equal(coll, collection);
        assert.deepEqual(args, ar);
        assert.equal(cb, cb);
      });

      Collection.proxy(_model, method, coll, args, cb);
    });

    ['find', 'foo'].forEach(function (method) {
      gently.expect(coll, method, function (arg, callback) {
        assert.equal(arg, args[0]);
        assert.deepEqual(callback, args[1]);
      });

      Collection.proxy(_model, method, coll, args, cb);
    });
  })

  .add('`proxy` can be called with no callback', function () {
    var coll = {foo: function () {}, find: function () {}},
        args = ['zemba'];

    ['update', 'insert', 'findArray'].forEach(function (method) {
      gently.expect(Collection, method, function (model, collection, ar, cb) {
        assert.equal(model, _model);
        assert.equal(coll, collection);
        assert.deepEqual(args, ar);
        assert.equal(typeof cb, 'function');
      });

      Collection.proxy(_model, method, coll, args);
    });

    ['find', 'foo'].forEach(function (method) {
      gently.expect(coll, method, function (arg, callback) {
        assert.equal(arg, args[0]);
        assert.deepEqual(callback, args[1]);
      });

      Collection.proxy(_model, method, coll, args);
    });
  })

  .add('`findArray` calls find on a collection with some arguments', function () {
    var coll = {foo: 'bar'},
        cb = function (error, cursor) {
          assert.deepEqual(error, "could not access DB");
        },
        cursor = {fleiba: 'zemba'},
        error_result = null,
        args = ['fleiba', cb];

    gently.expect(coll, 'find', function (collection, ar) {
      var cb = args[args.length - 1];
      assert.deepEqual(collection, args[0]);
      gently.expect(cursor, 'toArray');
      cb(null, cursor);
    });

    Collection.findArray(_model, coll, args, cb);
  })

  .add('`insert` inserts a record', function () {
    var coll = {insert: function (c, a) {}},
        cb = function (error, docs) {
          assert.deepEqual(error, 'could not access the DB');
          assert.equal(docs, null);
        },
        args = ['fleiba', cb];

    gently.expect(_model, 'beforeCreate', function (ar, callback) {
      assert.deepEqual(ar, args[0]);

      gently.expect(coll.insert, 'apply', function (collection, ars) {
        assert.deepEqual(collection, coll);
        assert.deepEqual(ars[0], ['document1', 'document2']);

        // OK
        gently.expect(_model, 'afterCreate', function (docs, callback) {
          assert.deepEqual(docs, [1, 2, 3]);
          assert.deepEqual(callback, cb);
        });
        ars[1](null, [1, 2, 3]);

        // ERROR
        gently.expect(_model, 'afterCreate');
        ars[1]('could not access the DB', [1, 2, 3]);
      });
      callback(null, ['document1', 'document2']);

    });

    Collection.insert(_model, coll, args, cb);
  })

  .add('`update` finds and modifies a record', function () {
    var coll = {update: function (c, a) {}},
        cb = function (error, docs) {
          assert.deepEqual(error, null);
          assert.deepEqual(docs, [1, 2, 3]);
        },
        args = [{name: 'zemba'}, {'$set': {name: 'foo'}}, {}, cb];

    gently.expect(_model, 'beforeUpdate', function (ar, callback) {
      assert.deepEqual(ar, args[1]);

      gently.expect(coll.update, 'apply', function (collection, ars) {
        assert.deepEqual(collection, coll);
        assert.deepEqual(ars[0], args[0]);
        assert.deepEqual(ars[1].$set.updated_at, 123);

        gently.expect(_model, 'afterUpdate');
        ars[3](null, [1, 2, 3]);
      });

      callback(null, {'$set': {name: 'foo', updated_at: 123}});
    });

    Collection.update(_model, coll, args, cb);
  })

  .add('`findAndModify` behaves like `update`', function () {
    assert.deepEqual(Collection.findAndModify, Collection.update);
  })

  .add('`mapReduceCursor` calls `mapReduce` returning a cursor', function () {
    var collection = {'mapReduce': function () {}},
        args = ['a', 'b'],
        coll = {foo: 'bar'};

    [null, 'could not access the DB'].forEach(function (error) {
      var cb = null;

      gently.expect(collection.mapReduce, 'apply', function (_collection, _args) {
        assert.equal(_collection, collection);
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

      Collection.mapReduceCursor(_model, collection, args, cb);
    });
  })

  .add('`mapReduceArray` returns a `mapReduceCursor` to Array', function () {
    var collection = {'mapReduce': function () {}},
        args = {},
        cursor = {},
        cb = function () {};

    gently.expect(Collection, 'mapReduceCursor', function (_collection, _args, _fn, _callback) {
      assert.equal(_collection, collection);
      assert.equal(_args, args);
      assert.equal(_fn, 'mapReduce');

      gently.expect(cursor, 'toArray', function (__callback) {
        assert.equal(__callback, cb);
      });
      _callback(null, cursor);
    });

    Collection.mapReduceArray(_model, collection, args, cb);
  })

  .add('`remove` removes a document', function () {
    var coll = {remove: function (c, a) {}},
        cb = function () {},
        args = ['fleiba', cb];

    gently.expect(_model, 'beforeRemove', function (ar, callback) {
      assert.deepEqual(ar, args[0]);

      gently.expect(coll.remove, 'apply', function (collection, ars) {
        assert.deepEqual(collection, coll);
        assert.deepEqual(ars[0], ['document1', 'document2']);
      });
      callback(null, ['document1', 'document2']);
    });

    Collection.remove(_model, coll, args, cb);
  })

  .run();
