var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/mapper_test.js'}),
    assert = testosterone.assert,
    Namespacer = require('./../../lib/helpers/mapper');

testosterone
  .before(function () {
  })

  .add('`filterUpdate` should filter documents before being inserted or updated', function () {
    var test = Namespacer.filterUpdate
      , arg
      , update = {zemba: 'FOO', fleiba: 123, foo: true}
      , maps = {
          zemba: function (val) {
            return val.toUpperCase();
          }
        , fleiba: Number
        , foo: Boolean
        };

    // document
    arg = {zemba: 'foo', fleiba: '123', foo: 'true'};
    test(maps, arg);
    assert.deepEqual(arg, update);

    // array
    arg = [{zemba: 'fleiba'}, {zemba: 'foo', fleiba: '123', foo: 'true'}];
    test(maps, arg);
    assert.deepEqual(arg[0], {zemba: 'FLEIBA'});
    assert.deepEqual(arg[1], update);

    // with sepcial ops
    arg = {'$set': {zemba: 'foo', fleiba: '123', foo: 'true'}};
    test(maps, arg);
    assert.deepEqual(arg, {'$set': update});
  })

  .run();

