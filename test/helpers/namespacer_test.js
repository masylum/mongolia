var testosterone = require('testosterone')({sync: true, title: 'mongolia/helpers/namespacer_test.js'}),
    assert = testosterone.assert,
    Namespacer = require('./../../lib/helpers/namespacer');

testosterone
  .before(function () {
  })

  .add('`resolveNamespace` implements the whole namespace API', function () {
    var test = Namespacer.resolveNamespace
      , namespaces = { jazz: ['mile.davis', 'coltrane', 'ellington', 'fitzgerald']
                     , modern: { extend: 'jazz'
                               , add: ['cohen', 'corea']
                               , remove: ['ellington', 'fitzgerald'] }};

    assert.deepEqual(test(namespaces, 'jazz'), namespaces.jazz);
    assert.deepEqual(test(namespaces, 'modern'), ['mile.davis', 'coltrane', 'cohen', 'corea']);
  })

  .add('`addFieldFindOne` adds `fields` to findOne method if using a namespace', function () {
    var test = Namespacer.addFieldFindOne
      , args
      , cb = function () {}
      , fields = {fields: {zemba: 1, fleiba: 1, 'nested.attribute': 1}}
      , visibility = ['nested.attribute', 'zemba', 'fleiba'];

    args = [{_id: 1}, cb];
    test(visibility, args);
    assert.deepEqual(args[1], fields);

    args = [{_id: 1}, {timeout: 1}, cb];
    test(visibility, args);
    assert.deepEqual(args[1].fields, fields.fields);
    assert.deepEqual(args[1].timeout, 1);

    args = [{_id: 1}, {fields: {zemba: -1}}, cb];
    test(visibility, args);
    assert.deepEqual(args[1], fields);
  })

  .add('`addFieldFind` adds `fields` to find methods if using a namespace', function () {
    var test = Namespacer.addFieldFind
      , args
      , cb = function () {}
      , fields = {zemba: 1, fleiba: 1, 'nested.attribute': 1}
      , visibility = ['nested.attribute', 'zemba', 'fleiba'];

    args = [{_id: 1}, cb];
    test(visibility, args);
    assert.deepEqual(args[1], fields);

    args = [{_id: 1}, {skip: 1}, cb];
    test(visibility, args);
    assert.deepEqual(args[1], fields);

    args = [{_id: 1}, {zemba: -1}, cb];
    test(visibility, args);
    assert.deepEqual(args[1], fields);

    args = [{_id: 1}, {zemba: -1}, {skip: 1}, cb];
    test(visibility, args);
    assert.deepEqual(args[1], fields);
  })

  .add('`addFieldFindAndModify` adds `fields` to findAndModify method if using a namespace', function () {
    var test = Namespacer.addFieldFindAndModify
      , args
      , cb = function () {}
      , fields = {fields: {zemba: 1, fleiba: 1, 'nested.attribute': 1}}
      , visibility = ['nested.attribute', 'zemba', 'fleiba'];

    args = [{_id: 1}, cb];
    test(visibility, args);
    assert.deepEqual(args[3], fields);

    args = [{_id: 1}, [], cb];
    test(visibility, args);
    assert.deepEqual(args[3], fields);

    args = [{_id: 1}, [], {foo: 'bar'}, cb];
    test(visibility, args);
    assert.deepEqual(args[3], fields);

    args = [{_id: 1}, [], {foo: 'bar'}, {fields:  {zemba: -1}}, cb];
    test(visibility, args);
    assert.deepEqual(args[3], fields);
  })

  .add('`filterUpdate` should filter documents before being inserted or updated', function () {
    var test = Namespacer.filterUpdate
      , arg
      , insert = {django: {reinhardt: 'guitar', framework: null}, charlie: {parker: 'saxophone'}}
      , update = {django: {reinhardt: 'guitar', framework: null}, 'charlie.parker': 'saxophone'}
      , visibility = ['django', 'charlie.parker'];

    // insert/update
    arg = {django: {reinhardt: 'guitar', framework: null}, charlie: {christian: 'guitar', parker: 'saxophone'}};
    test(visibility, arg);
    assert.deepEqual(arg, insert);

    // insert/update
    arg = { django: {reinhardt: 'guitar', framework: null}, will_not: 'be_inserted', charlie: { christian: 'guitar', parker: 'saxophone'}};
    test(visibility, arg);
    assert.deepEqual(arg, insert);

    // insert/update
    arg = [
      {django: {reinhardt: 'guitar', framework: null}, will_not: 'be_inserted', charlie: { christian: 'guitar', parker: 'saxophone'}}
    , {django: {reinhardt: 'guitar', framework: null}, will_not: 'be_inserted'}
    ];
    test(visibility, arg);
    assert.deepEqual(arg[0], {django: {reinhardt: 'guitar', framework: null}, charlie: {parker: 'saxophone'}});
    assert.deepEqual(arg[1], {django: {reinhardt: 'guitar', framework: null}});

    // update with sepcial ops
    arg = {'$set': {django: {reinhardt: 'guitar', framework: null}, 'charlie.christian': 'guitar', 'charlie.parker': 'saxophone'}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': update});

    // update with sepcial ops dot notation
    arg = {'$set': {'django.reinhardt': 'piano'}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': {'django.reinhardt': 'piano'}});

    // update with sepcial ops
    arg = {'$set': {django: {reinhardt: 'guitar', framework: null}, will_not: 'be_update', charlie: { christian: 'guitar', parker: 'saxophone'}}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': {django: {reinhardt: 'guitar', framework: null}, charlie: {parker: 'saxophone'}}});
  })

  .run();
