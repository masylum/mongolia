var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/collection_proxy.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Collection = require('./../../lib/helpers/collection_proxy');
    Collection.MODEL = {};

testosterone

  .add('#proxy delegates every call to a function of Collection', function () {
    var collection = {},
      args = {},
      cb = function () {};

    gently.expect(Collection, 'find', function (_collection, _args, _fn, _cb) {
      assert.equal(_collection, collection);
      assert.equal(_args, args);
      assert.equal(_fn, 'find');
      assert.equal(_cb, cb);
    });

    Collection.proxy('find', collection, args, cb);
  })

  .add('#findArray calls find on a collection with some arguments', function () {
    var collection = {'find': function () {}},
      args = {},
      cb = function () {};

    gently.expect(collection['find'], 'apply', function (_collection, _args) {
      assert.equal(_collection, collection);
      assert.equal(_args, args);
      // TODO: Ensure this piece of code gets called.
      // assert.equal(_args[args.length -1], function (error, cursor) {
      //   cursor.toArray(callback);
      // });
    });

    Collection.findArray(collection, args, 'find', cb);
  })

  // TODO: Fix undefined MODEL
  .add('#insert inserts a record', function () {
    console.log("\033[0;31mPENDING: (undefined MODEL)\033[0m");
  })

  // TODO: Fix undefined MODEL
  .add('#findAndModify finds and modifies a record', function () {
    console.log("\033[0;31mPENDING: (undefined MODEL)\033[0m");
  })

  .add('#mapReduceCursor calls mapReduce returning a cursor', function () {
    var collection = {'mapReduce': function () {}},
      args = {},
      cb = function () {};

    gently.expect(collection['mapReduce'], 'apply', function (_collection, _args) {
      assert.equal(_collection, collection);
      assert.equal(_args, args);
      // TODO: Ensure this piece of code gets called.
      // assert.equal(_args[args.length -1], function (error, collection) {
      //   collection.find(callback);
      // });
    });

    Collection.mapReduceCursor(collection, args, 'whatever', cb);
  })

  .add('#mapReduceArray returns a mapReduceCursor to Array', function () {
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
    require('sys').print('done!');
  });
