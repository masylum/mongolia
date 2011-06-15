var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/update_document.js'}),
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

  .add('`$inc` increases doc value using `dot_notation`', function () {
    var update = {'$inc': {'foo.bar': 3}}
      , doc = {foo: {bar: 1}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 4}});
  })

  .add('`$inc` sets doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$inc': {'foo.bar': 3}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 3}});
  })

  .add('`$set` sets doc value', function () {
    var update = {'$set': {foo: 'zemba'}}
      , doc = {foo: 'bar', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: 'zemba', hey: 'joe'});
  })

  .add('`$set` sets doc value using `dot_notation`', function () {
    var update = {'$set': {'foo.bar': 'zemba'}}
      , doc = {foo: {bar: 'joe'}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 'zemba'}});
  })

  .add('`$set` sets doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$set': {'foo.bar': 'zemba'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 'zemba'}});
  })

  .add('`$unset` unsets doc value', function () {
    var update = {'$unset': {foo: 1}}
      , doc = {foo: 'bar', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {hey: 'joe'});
  })

  .add('`$unset` unsets doc value using `dot_notation`', function () {
    var update = {'$unset': {'foo.bar.hey': 1}}
      , doc = {foo: {bar: {hey: 'joe'}}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: {}}});
  })

  .add('`$unset` unsets doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$unset': {'foo.bar.hey': 1}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  })

  .add('`$push` pushes doc value', function () {
    var update = {'$push': {foo: 'fleiba'}}
      , doc = {foo: ['bar'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'fleiba'], hey: 'joe'});
  })

  .add('`$push` pushes doc value using `dot_notation`', function () {
    var update = {'$push': {'foo.bar': 'fleiba'}}
      , doc = {foo: {bar: ['bar']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'fleiba']}});
  })

  .add('`$push` pushes doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$push': {'foo.bar': 'fleiba'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['fleiba']}});
  })

  .add('`$pushAll` pushes doc array', function () {
    var update = {'$pushAll': {foo: ['zemba', 'fleiba']}}
      , doc = {foo: ['bar'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'});
  })

  .add('`$pushAll` pushes doc array using `dot_notation`', function () {
    var update = {'$pushAll': {'foo.bar': ['zemba', 'fleiba']}}
      , doc = {foo: {bar: ['bar']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'zemba', 'fleiba']}});
  })

  .add('`$pushAll` pushes doc array using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pushAll': {'foo.bar': ['zemba', 'fleiba']}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['zemba', 'fleiba']}});
  })

  .add('`$addToSet` pushes doc value if not present', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {foo: 'zemba'}}
        , doc = {foo: ['bar'], hey: 'joe'}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: ['bar', 'zemba'], hey: 'joe'});
    });
  })

  .add('`$addToSet` pushes doc value if not present using `dot_notation`', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {'foo.bar': 'zemba'}}
        , doc = {foo: {bar: ['bar']}}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: {bar: ['bar', 'zemba']}});
    });
  })

  .add('`$addToSet` pushes doc value if not present using `dot_notation` on `inexistant` elements', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {'foo.bar': 'zemba'}}
        , doc = {}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: {bar: ['zemba']}});
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

  .add('`$pop` pops array element using `dot_notation`', function () {
    var update = {'$pop': {'foo.bar': 1}}
      , doc = {foo: {bar: ['bar', 'zemba', 'fleiba']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'zemba']}});

    update = {'$pop': {'foo.bar': -1}};
    doc = {foo: {bar: ['bar', 'zemba', 'fleiba']}};
    ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['zemba', 'fleiba']}});
  })

  .add('`$pop` pops array element using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pop': {'foo.bar': 1}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  })

  .add('`$pull` removes array elements matchin a value', function () {
    var update = {'$pull': {foo: 'zemba'}}
      , doc = {foo: ['bar', 'zemba', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'fleiba'], hey: 'joe'});
  })

  .add('`$pull` removes array elements matchin a value using `dot_notation`', function () {
    var update = {'$pull': {'foo.bar': 'zemba'}}
      , doc = {foo: {bar: ['bar', 'zemba', 'zemba', 'fleiba']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'fleiba']}});
  })

  .add('`$pull` removes array elements matchin a value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pull': {'foo.bar': 'zemba'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  })

  .add('`$pullAll` removes array elements in a array', function () {
    var update = {'$pullAll': {foo: ['fleiba', 'zemba']}}
      , doc = {foo: ['bar', 'zemba', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar'], hey: 'joe'});
  })

  .add('`$pullAll` removes array elements in a array using `dot_notation`', function () {
    var update = {'$pullAll': {'foo.bar': ['fleiba', 'zemba']}}
      , doc = {foo: {bar: ['bar', 'zemba', 'zemba', 'fleiba']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar']}});
  })

  .add('`$pullAll` removes array elements in a array using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pullAll': {'foo.bar': ['fleiba', 'zemba']}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  })

  .add('`$rename` renames a field', function () {
    var update = {'$rename': {foo: 'bar'}}
      , doc = {foo: 'foo', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {bar: 'foo', hey: 'joe'});
  })

  .add('`$rename` renames a field using `dot_notation`', function () {
    var update = {'$rename': {'foo.bar': 'far'}}
      , doc = {foo: {bar: 'foo'}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {far: 'foo'}});
  })

  .add('`$rename` renames a field using `dot_notation` on `inexistant` elements', function () {
    var update = {'$rename': {'foo.bar': 'far'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  })

  .run();
