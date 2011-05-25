var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/collection_proxy.js'}),
    assert = testosterone.assert,
    UpdateDocument = require('./../../lib/helpers/update_document');

testosterone

  .add('should return update document if its not an special operation', function () {
    var update = {foo: 'bar'}
      , doc = {foo: 'zemba', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, update);
  })

  .add('`$inc` increases doc value', function () {
    var update = {'$inc': {foo: 3}}
      , doc = {foo: 1, hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: 4, hey: 'joe'});
  })

  .add('`$set` sets doc value', function () {
    var update = {'$set': {foo: 'zemba'}}
      , doc = {foo: 'bar', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: 'zemba', hey: 'joe'});
  })

  .add('`$unset` unsets doc value', function () {
    var update = {'$unset': {foo: 1}}
      , doc = {foo: 'bar', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {hey: 'joe'});
  })

  .add('`$push` pushes doc value', function () {
    var update = {'$push': {foo: 'fleiba'}}
      , doc = {foo: ['bar'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'fleiba'], hey: 'joe'});
  })

  .add('`$pushAll` pushes doc array', function () {
    var update = {'$pushAll': {foo: ['zemba', 'fleiba']}}
      , doc = {foo: ['bar'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'});
  })

  .add('`$addToSet` pushes doc value if not present', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {foo: 'zemba'}}
        , doc = {foo: ['bar'], hey: 'joe'}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: ['bar', 'zemba'], hey: 'joe'});
    });
  })

  .add('`$pop` pops array element', function () {
    var update = {'$pop': {foo: 1}}
      , doc = {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'zemba'], hey: 'joe'});

    update = {'$pop': {foo: -1}};
    doc = {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'};
    ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['zemba', 'fleiba'], hey: 'joe'});
  })

  .add('`$pull` removes array elements matchin a value', function () {
    var update = {'$pull': {foo: 'zemba'}}
      , doc = {foo: ['bar', 'zemba', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'fleiba'], hey: 'joe'});
  })

  .add('`$pullAll` removes array elements in a array', function () {
    var update = {'$pullAll': {foo: ['fleiba', 'zemba']}}
      , doc = {foo: ['bar', 'zemba', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar'], hey: 'joe'});
  })

  .add('`$rename` renames a field', function () {
    var update = {'$rename': {foo: 'bar'}}
      , doc = {foo: 'foo', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {bar: 'foo', hey: 'joe'});
  })

  .run();
