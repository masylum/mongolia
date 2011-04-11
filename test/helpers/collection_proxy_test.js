var testosterone = require('testosterone')({post: 3000, sync: true, title: 'mongolia/helpers/collection_proxy.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    collection_proxy = require('./../../lib/helpers/collection_proxy');

testosterone

  .add('The truth', function () {

  })

  .run(function () {
    require('sys').print('done!');
  });
