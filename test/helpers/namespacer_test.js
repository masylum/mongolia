var testosterone = require('testosterone')({sync: true, title: 'mongolia/helpers/namespacer_test.js'}),
    assert = testosterone.assert,
    Namespacer = require('./../../lib/helpers/namespacer');

testosterone
  .before(function () {
  })

  .add('`resolveNamespace` implements the whole namespace API', function () {
    var test = Namespacer.resolveNamespace
      , namespaces = { jazz: ['davis', 'coltrane', 'ellington', 'fitzgerald']
                     , modern: { extend: 'jazz'
                               , add: ['cohen', 'corea']
                               , remove: ['ellington', 'fitzgerald'] }};

    assert.deepEqual(test(namespaces, 'jazz'), namespaces.jazz);
    assert.deepEqual(test(namespaces, 'modern'), ['davis', 'coltrane', 'cohen', 'corea']);
  })

  .add('`addFieldFind` adds `fields` to find methods if using a namespace', function () {
    var test = Namespacer.addFieldFind
      , args
      , cb = function () {}
      , fields = {zemba: 1, fleiba: 1}
      , visibility = ['zemba', 'fleiba'];

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
      , fields = {fields: {zemba: 1, fleiba: 1}}
      , visibility = ['zemba', 'fleiba'];

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
      , update = {zemba: 'foo', fleiba: 'bar'}
      , visibility = ['zemba', 'fleiba', 'coltrane'];

    // insert
    arg = {zemba: 'foo', fleiba: 'bar'};
    test(visibility, arg);
    assert.deepEqual(arg, update);

    arg = {zemba: 'foo', fleiba: 'bar', will_not: 'be_inserted'};
    test(visibility, arg);
    assert.deepEqual(arg, update);

    arg = [{zemba: 'foo', will_not: 'be_inserted'}, {zemba: 'foo', fleiba: 'bar', will_not: 'be_inserted'}];
    test(visibility, arg);
    assert.deepEqual(arg[0], {zemba: 'foo'});
    assert.deepEqual(arg[1], update);

    // with sepcial ops
    arg = {'$set': {zemba: 'foo', fleiba: 'bar'}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': update});

    arg = {'$set': {zemba: 'foo', fleiba: 'bar', will_not: 'be_update'}};
    test(visibility, arg);
    assert.deepEqual(arg, {'$set': update});
  })

  .run();
