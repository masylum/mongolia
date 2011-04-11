var testosterone = require('testosterone')({post: 3000, sync: true}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    utils = require('./../lib/utils')

testosterone

  .add('#isEmpty returns true for null, undefined or false, and also if the object has empty keys', function () {
    var null_object = null,
        false_object = false,
        empty_object = {
        };

    assert.ok(utils.isEmpty(null_object), 'Null objects should be empty');
    assert.ok(utils.isEmpty(false_object), 'False objects should be empty');
    assert.ok(utils.isEmpty(empty_object), 'Empty objects should be empty');
  })

  .run(function () {
    require('sys').print('done!');
  });
