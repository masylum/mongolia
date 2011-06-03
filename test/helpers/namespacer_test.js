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
      , insert = {reinhardt: 'guitar', gillespie: 'trumpet', charlie: {parker: 'saxophone'}}
      , update = {reinhardt: 'guitar', gillespie: 'trumpet', 'charlie.parker': 'saxophone'}
      , visibility = ['reinhardt', 'gillespie', 'charlie.parker'];

    // insert/update
    arg = {reinhardt: 'guitar', gillespie: 'trumpet', charlie: {christian: 'guitar', parker: 'saxophone'}};
    test(visibility, arg);
    assert.deepEqual(arg, insert);

    // insert/update
    arg = { reinhardt: 'guitar', gillespie: 'trumpet', will_not: 'be_inserted', charlie: { christian: 'guitar', parker: 'saxophone'}};
    test(visibility, arg);
    assert.deepEqual(arg, insert);

    // insert/update
    arg = [
      {reinhardt: 'guitar', will_not: 'be_inserted', charlie: { christian: 'guitar', parker: 'saxophone'}}
    , {reinhardt: 'guitar', gillespie: 'trumpet', will_not: 'be_inserted'}
    ];
    test(visibility, arg);
    assert.deepEqual(arg[0], {reinhardt: 'guitar', charlie: {parker: 'saxophone'}});
    assert.deepEqual(arg[1], {reinhardt: 'guitar', gillespie: 'trumpet'});

    // update with sepcial ops
    arg = {'$set': {reinhardt: 'guitar', gillespie: 'trumpet', 'charlie.christian': 'guitar', 'charlie.parker': 'saxophone'}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': update});

    // update with sepcial ops
    arg = {'$set': {reinhardt: 'guitar', gillespie: 'trumpet', will_not: 'be_update', charlie: { christian: 'guitar', parker: 'saxophone'}}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': {reinhardt: 'guitar', gillespie: 'trumpet', charlie: {parker: 'saxophone'}}});
  })

  .run();
