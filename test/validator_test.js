var testosterone = require('testosterone')({post: 3000, title: 'mongolia/validator.js'}),
    assert = testosterone.assert;

testosterone
  // using done to tell testosterone when the test is done

  .run(function () {
    require('sys').print('done!');
  });
