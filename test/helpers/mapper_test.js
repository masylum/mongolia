var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/mapper_test.js'}),
    assert = testosterone.assert,
    Namespacer = require('./../../lib/helpers/mapper');

testosterone
  .before(function () {
  })

  .add('`filterUpdate` should filter documents before being inserted or updated', function () {
    var test = Namespacer.filterUpdate
      , arg
      , toUpper = function (val) {
          return val.toUpperCase();
        }
      , update = {zemba: 'FOO', nested: {id: 123, name: '300'}, foo: true}
      , maps = { zemba: toUpper
               , nested: { id: Number
                         , name: String
                         }
               , foo: Boolean
               };

    // document
    arg = {zemba: 'foo', nested: {id: '123', name: 300}, foo: 'true'};
    test(maps, arg);
    assert.deepEqual(arg, update);
    assert.equal(typeof arg.nested.id, typeof update.nested.id);
    assert.equal(typeof arg.nested.name, typeof update.nested.name);

    // array
    arg = [{zemba: 'fleiba'}, {zemba: 'foo', nested: {id: '123', name: 300}, foo: 'true'}];
    test(maps, arg);
    assert.deepEqual(arg[0], {zemba: 'FLEIBA'});
    assert.deepEqual(arg[1], update);
    assert.equal(typeof arg[1].nested.id, typeof update.nested.id);
    assert.equal(typeof arg[1].nested.name, typeof update.nested.name);

    // with sepcial ops
    arg = {'$set': {zemba: 'foo', nested: {id: '123', name: 300}, foo: 'true'}};
    test(maps, arg);
    assert.deepEqual(arg, {'$set': update});
    assert.equal(typeof arg.$set.nested.id, typeof update.nested.id);
    assert.equal(typeof arg.$set.nested.name, typeof update.nested.name);
  })

  .run();

