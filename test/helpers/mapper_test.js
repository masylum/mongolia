var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/mapper_test.js'}),
    assert = testosterone.assert,
    Mapper = require('./../../lib/helpers/mapper');

testosterone
  .add('`mapDocument` should filter documents before being inserted or updated', function () {
    var test = Mapper.mapDocument
      , arg
      , toUpper = function (val) {
          return val.toUpperCase();
        }
      , update = {zemba: 'FOO', nested: {id: 123, name: '300'}, list: [1, 2, 3], foo: true}
      , maps = { zemba: toUpper
               , nested: { id: Number
                         , name: String
                         }
               , list: Number
               , foo: Boolean
               };

    // document
    arg = {zemba: 'foo', nested: {id: '123', name: 300}, list: [1, 2, 3], foo: 'true'};
    test(maps, arg);
    assert.deepEqual(arg, update);
    assert.equal(typeof arg.nested.id, typeof update.nested.id);
    assert.equal(typeof arg.nested.name, typeof update.nested.name);

    // array
    arg = [{zemba: 'fleiba'}, {zemba: 'foo', nested: {id: '123', name: 300}, list: [1, 2, 3], foo: 'true'}];
    test(maps, arg);
    assert.deepEqual(arg[0], {zemba: 'FLEIBA'});
    assert.deepEqual(arg[1], update);
    assert.equal(typeof arg[1].nested.id, typeof update.nested.id);
    assert.equal(typeof arg[1].nested.name, typeof update.nested.name);

    // with sepcial ops
    arg = {'$set': {zemba: 'foo', nested: {id: '123', name: 300}, list: [1, 2, 3], foo: 'true'}};
    test(maps, arg);
    assert.deepEqual(arg, {'$set': update});
    assert.equal(typeof arg.$set.nested.id, typeof update.nested.id);
    assert.equal(typeof arg.$set.nested.name, typeof update.nested.name);

    // dot notation
    arg = {'$set': {'nested.id': '123', 'nested.name': 300, foo: 'true'}};
    test(maps, arg);
    assert.equal(typeof arg.$set['nested.id'], typeof update.nested.id);
    assert.equal(typeof arg.$set['nested.name'], typeof update.nested.name);

    // array values
    arg = {list: ['1', '2', 3]};
    test(maps, arg);
    assert.equal(typeof arg.list[0], typeof update.list[0]);
    assert.equal(typeof arg.list[1], typeof update.list[1]);
    assert.equal(typeof arg.list[2], typeof update.list[2]);
  })

  .run();

