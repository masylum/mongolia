var testosterone = require('testosterone')({post: 3000, sync: true, title: 'testosterone/utils.js'}),
  assert = testosterone.assert,

  utils = require('./../lib/utils');

testosterone

  .add('#isEmpty returns true for null, undefined or false, and also if the object has empty keys', function () {
    var null_object = null,
      false_object = false,
      empty_object = {};

    assert.ok(utils.isEmpty(null_object),  'Null objects should be empty');
    assert.ok(utils.isEmpty(undefined),    'Undefined should be empty');
    assert.ok(utils.isEmpty(false_object), 'False objects should be empty');
    assert.ok(utils.isEmpty(empty_object), 'Empty objects should be empty');
  })

  .add('#clone makes a shallow copy of an object', function () {
    var fun  = function () {},
      date   = new Date(),
      regexp = new RegExp(/regex/),
      object = {
        foo: 'bar',
        bar: 'baz'
      };
      
    // Not clonable, just return the same object
    assert.equal(utils.clone(null),    null);
    assert.equal(utils.clone(fun), fun);
 
    assert.equal(utils.clone(date), date);
    assert.strictEqual(utils.clone(date), date);

    assert.equal(utils.clone(regexp), regexp);
    assert.strictEqual(utils.clone(regexp), regexp);

    // Clonable
    assert.deepEqual(utils.clone(object), object);
    assert.notStrictEqual(utils.clone(object), object);
  })

  .add("#merge merges two object's properties", function () {
    var foo = {
        foo: 'bar',
        bar: 'baz'
      },
      bar = {
        java: 'creepy',
        node: 'js'
      };
        
    assert.deepEqual(utils.merge(foo, bar), { 
      foo:  'bar',
      bar:  'baz',
      java: 'creepy',
      node: 'js'
    });
       
    // If there's no second object, just return the first
    assert.equal(utils.merge(foo, null), foo);
  })

  .add("#mergeDeep performs a deep merge", function () {
    var foo = {
        foo: 'bar',
        bar: 'baz',
        baz: {a: 'hey'}
      },
      bar = {
        java: 'creepy',
        node: 'js',
        baz: {b: 'ho'}
      };
       
    assert.deepEqual(utils.mergeDeep(foo, bar), { 
      foo:  'bar',
      bar:  'baz',
      baz:  {a: 'hey', b: 'ho'},
      java: 'creepy',
      node: 'js'
    });
       
    // If there's no second object, just return the first
    assert.equal(utils.merge(foo, null), foo);
  })

  .add('#values extracts an array of values from an object', function () {
    var foo = {
      a: 'foo',
      b: 'bar',
      c: 'baz'
    };

    assert.deepEqual(utils.values(foo), [ 'foo', 'bar', 'baz' ]);
  })

  .add('#intersect returns the intersection of two arrays', function () {
    var a = ['foo', 'bar', 'baz'],
      b = ['bar', 'baz', 'qux'];

    assert.deepEqual(utils.intersect(a, b), [ 'bar', 'baz' ]);
  })

  .run(function () {
    require('sys').print('done!');
  });
