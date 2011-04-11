var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/collection_proxy.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Collection = require('./../../lib/helpers/collection_proxy'),

    _model = {};

testosterone

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

  .add('`findArray` calls find on a collection with some arguments', function () {
    var coll = {foo: 'bar'},
        cb = function (error, cursor) {},
        cursor = {fleiba: 'zemba'},
        args = ['fleiba', cb];

    gently.expect(coll, 'find', function (ar, callback) {
      assert.deepEqual(ar, args[0]);

      // OK
      gently.expect(cursor, 'toArray', function (callback) {
        assert.deepEqual(callback, cb);
      });
      args[1](null, cursor);

      // TODO: test error
    });

    gently.restore(Collection, 'findArray');
    Collection.findArray(_model, coll, args, cb);
  })

  // TODO: Fix undefined MODEL
  .add('`insert` inserts a record', function () {
    var coll = {foo: 'bar'},
        cb = function () {},
        args = ['fleiba', cb];

    console.log("\033[0;31mPENDING: (undefined MODEL)\033[0m");
  })

  // TODO: Fix undefined MODEL
  .add('`findAndModify` finds and modifies a record', function () {
    var coll = {foo: 'bar'},
        cb = function () {},
        args = ['fleiba', cb];

    console.log("\033[0;31mPENDING: (undefined MODEL)\033[0m");
  })

  .add('`mapReduceCursor` calls mapReduce returning a cursor', function () {
    var collection = {'mapReduce': function () {}},
      args = {},
      cb = function () {};

    gently.expect(collection.mapReduce, 'apply', function (_collection, _args) {
      assert.equal(_collection, collection);
      assert.equal(_args, args);
      // TODO: Ensure this piece of code gets called.
      // assert.equal(_args[args.length -1], function (error, collection) {
      //   collection.find(callback);
      // });
    });

    Collection.mapReduceCursor(collection, args, 'whatever', cb);
  })

  .add('`mapReduceArray` returns a mapReduceCursor to Array', function () {
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

    Collection.mapReduceArray(collection, args, 'whatever', cb);
  })

  .run(function () {
    // zemba
  });
