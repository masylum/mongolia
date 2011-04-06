var testosterone = require('testosterone')({post: 3000, sync: true}),
    assert = testosterone.assert;

var Model = require('./../lib/model'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Server = mongodb.Server,
    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {});

testosterone

  .add('WHEN there is no db\n' +
       'THEN it throws an error', function (spec) {
    assert.throws(function () {
        var model = new Model(null);
    }, /You must specify a db/);
  })

  .add('WHEN there is no collection\n' +
       'THEN it throws an error', function (spec) {
    assert.throws(function () {
        var model = new Model(db);
    }, /You must specify a collection name/);
  })

  .run(function () {
    require('sys').print('done!');
  });
