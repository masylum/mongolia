var testosterone = require('testosterone')({post: 3000}),
    assert = testosterone.assert;

testosterone
  // using done to tell testosterone when the test is done

  .run(function () {
    require('sys').print('done!');
  });
