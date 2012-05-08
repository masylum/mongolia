/*globals describe, it*/
var assert = require('assert')
  , UpdateDocument = require('./../lib/helpers/update_document');

describe('namespacer', function () {

  it('should return update document if its not an special operation', function () {
    var update = {foo: 'bar'}
      , doc = {foo: 'zemba', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, update);
  });

  it('`$inc` increases doc value', function () {
    var update = {'$inc': {foo: 3}}
      , doc = {foo: 1, hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: 4, hey: 'joe'});
  });

  it('`$inc` increases doc value using `dot_notation`', function () {
    var update = {'$inc': {'foo.bar': 3}}
      , doc = {foo: {bar: 1}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 4}});
  });

  it('`$inc` sets doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$inc': {'foo.bar': 3}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 3}});
  });

  it('`$set` sets doc value', function () {
    var update = {'$set': {foo: 'zemba'}}
      , doc = {foo: 'bar', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: 'zemba', hey: 'joe'});
  });

  it('`$set` sets doc value using `dot_notation`', function () {
    var update = {'$set': {'foo.bar': 'zemba'}}
      , doc = {foo: {bar: 'joe'}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 'zemba'}});
  });

  it('`$set` sets doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$set': {'foo.bar': 'zemba'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: 'zemba'}});
  });

  it('`$unset` unsets doc value', function () {
    var update = {'$unset': {foo: 1}}
      , doc = {foo: 'bar', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {hey: 'joe'});
  });

  it('`$unset` unsets doc value using `dot_notation`', function () {
    var update = {'$unset': {'foo.bar.hey': 1}}
      , doc = {foo: {bar: {hey: 'joe'}}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: {}}});
  });

  it('`$unset` unsets doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$unset': {'foo.bar.hey': 1}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  });

  it('`$push` pushes doc value', function () {
    var update = {'$push': {foo: 'fleiba'}}
      , doc = {foo: ['bar'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'fleiba'], hey: 'joe'});
  });

  it('`$push` pushes doc value using `dot_notation`', function () {
    var update = {'$push': {'foo.bar': 'fleiba'}}
      , doc = {foo: {bar: ['bar']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'fleiba']}});
  });

  it('`$push` pushes doc value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$push': {'foo.bar': 'fleiba'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['fleiba']}});
  });

  it('`$pushAll` pushes doc array', function () {
    var update = {'$pushAll': {foo: ['zemba', 'fleiba']}}
      , doc = {foo: ['bar'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'});
  });

  it('`$pushAll` pushes doc array using `dot_notation`', function () {
    var update = {'$pushAll': {'foo.bar': ['zemba', 'fleiba']}}
      , doc = {foo: {bar: ['bar']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'zemba', 'fleiba']}});
  });

  it('`$pushAll` pushes doc array using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pushAll': {'foo.bar': ['zemba', 'fleiba']}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['zemba', 'fleiba']}});
  });

  it('`$addToSet` pushes doc value if not present', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {foo: 'zemba'}}
        , doc = {foo: ['bar'], hey: 'joe'}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: ['bar', 'zemba'], hey: 'joe'});
    });
  });

  it('`$addToSet` pushes doc value if not present using `dot_notation`', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {'foo.bar': 'zemba'}}
        , doc = {foo: {bar: ['bar']}}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: {bar: ['bar', 'zemba']}});
    });
  });

  it('`$addToSet` pushes doc value if not present using `dot_notation` on `inexistant` elements', function () {
    [0, 1].forEach(function () {
      var update = {'$addToSet': {'foo.bar': 'zemba'}}
        , doc = {}
        , ret = UpdateDocument({document: doc, update: update});

      assert.deepEqual(ret, {foo: {bar: ['zemba']}});
    });
  });

  it('`$pop` pops array element', function () {
    var update = {'$pop': {foo: 1}}
      , doc = {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'zemba'], hey: 'joe'});

    update = {'$pop': {foo: -1}};
    doc = {foo: ['bar', 'zemba', 'fleiba'], hey: 'joe'};
    ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['zemba', 'fleiba'], hey: 'joe'});
  });

  it('`$pop` pops array element using `dot_notation`', function () {
    var update = {'$pop': {'foo.bar': 1}}
      , doc = {foo: {bar: ['bar', 'zemba', 'fleiba']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'zemba']}});

    update = {'$pop': {'foo.bar': -1}};
    doc = {foo: {bar: ['bar', 'zemba', 'fleiba']}};
    ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['zemba', 'fleiba']}});
  });

  it('`$pop` pops array element using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pop': {'foo.bar': 1}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  });

  it('`$pull` removes array elements matchin a value', function () {
    var update = {'$pull': {foo: 'zemba'}}
      , doc = {foo: ['bar', 'zemba', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar', 'fleiba'], hey: 'joe'});
  });

  it('`$pull` removes array elements matchin a value using `dot_notation`', function () {
    var update = {'$pull': {'foo.bar': 'zemba'}}
      , doc = {foo: {bar: ['bar', 'zemba', 'zemba', 'fleiba']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar', 'fleiba']}});
  });

  it('`$pull` removes array elements matchin a value using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pull': {'foo.bar': 'zemba'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  });

  it('`$pullAll` removes array elements in a array', function () {
    var update = {'$pullAll': {foo: ['fleiba', 'zemba']}}
      , doc = {foo: ['bar', 'zemba', 'zemba', 'fleiba'], hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: ['bar'], hey: 'joe'});
  });

  it('`$pullAll` removes array elements in a array using `dot_notation`', function () {
    var update = {'$pullAll': {'foo.bar': ['fleiba', 'zemba']}}
      , doc = {foo: {bar: ['bar', 'zemba', 'zemba', 'fleiba']}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {bar: ['bar']}});
  });

  it('`$pullAll` removes array elements in a array using `dot_notation` on `inexistant` elements', function () {
    var update = {'$pullAll': {'foo.bar': ['fleiba', 'zemba']}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  });

  it('`$rename` renames a field', function () {
    var update = {'$rename': {foo: 'bar'}}
      , doc = {foo: 'foo', hey: 'joe'}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {bar: 'foo', hey: 'joe'});
  });

  it('`$rename` renames a field using `dot_notation`', function () {
    var update = {'$rename': {'foo.bar': 'far'}}
      , doc = {foo: {bar: 'foo'}}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {foo: {far: 'foo'}});
  });

  it('`$rename` renames a field using `dot_notation` on `inexistant` elements', function () {
    var update = {'$rename': {'foo.bar': 'far'}}
      , doc = {}
      , ret = UpdateDocument({document: doc, update: update});

    assert.deepEqual(ret, {});
  });
});
