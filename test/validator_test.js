var testosterone = require('testosterone')({sync: true, title: 'mongolia/validator.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Validator = require('./../lib/validator');

testosterone

  .add('initial status', function () {
    var update = {'$set': {foo: 'bar'}}
      , doc = {foo: 'zemba', hey: 'joe'}
      , val = Validator({}, update)
      , val2 = Validator(doc, update);

    assert.deepEqual(val.errors, {});
    assert.deepEqual(val.document, {});
    assert.deepEqual(val.update, update);
    assert.deepEqual(val.updated_document, {foo: 'bar'});

    assert.deepEqual(val2.errors, {});
    assert.deepEqual(val2.document, doc);
    assert.deepEqual(val2.update, update);
    assert.deepEqual(val2.updated_document, {foo: 'bar', hey: 'joe'});
  })

  .add('`addError` adds a validation error', function () {
    var val = Validator({}, {foo: 'bar'})
      , error = 'foo error';

    val.addError('foo', error);
    assert.equal(val.errors.foo[0], error);
  })

  .add('`hasErrors` returns true if the validator has errors', function () {
    var val = Validator({}, {foo: 'bar'});

    val.addError('foo', 'foo error');
    assert.ok(val.hasErrors());
  })

  .add('`hasError` returns true if the validator has a particular error', function () {
    var val = Validator({}, {foo: 'bar'});

    val.addError('foo', 'foo error');
    assert.ok(val.hasError('foo'));
  })

  .add('nested `addError` adds a nested error', function () {
    var val = Validator({}, {foo: 'bar'});

    val.addError('foo.zemba', 'foo error');
    assert.equal(val.errors.foo.zemba[0], 'foo error');
  })

  .add('`hasErrors` returns whether the validator has nested errors', function () {
    var val = Validator({}, {foo: 'bar'});

    val.addError('foo.zemba', 'foo error');
    assert.ok(val.hasErrors());
  })

  .add('`hasError` returns whether the validator has a particular nested error', function () {
    var val = Validator({}, {foo: 'bar'});

    val.addError('foo.zemba', 'foo error');
    assert.ok(val.hasError('foo.zemba'));
  })

  .add('`hasError` and `hasErrors` return false when there are no errors', function () {
    var val = Validator({}, {foo: 'bar'});

    assert.equal(val.hasError('foo.zemba'), false);
    assert.equal(val.hasErrors(), false);
  })

  .add('multiple errors per field', function () {
    var val = Validator({}, {foo: 'bar'});

    val.addError('foo.zemba', 'error1');
    assert.ok(val.hasError('foo.zemba'));

    val.addError('foo.zemba', 'error2');
    assert.deepEqual(val.errors.foo.zemba, ['error1', 'error2']);
    assert.equal(val.hasError('foo.zemba'), true);

    val.addError('foo.bla', 'error3');
    assert.deepEqual(val.errors.foo.zemba, ['error1', 'error2']);
    assert.deepEqual(val.errors.foo.bla, ['error3']);
  })

  .add('`isUpdating` returns whether the model is being updated', function () {
    var update = {foo: 'bar'}
      , val = Validator({}, update)
      , val2 = Validator({zemba: 'fleiba'}, update);

    assert.equal(val.isUpdating(), false);
    assert.equal(val2.isUpdating(), true);
  })

  .add('`isInserting` returns whether the model is being inserted', function () {
    var update = {foo: 'bar'}
      , val = Validator({}, update)
      , val2 = Validator({zemba: 'fleiba'}, update);

    assert.equal(val.isInserting(), true);
    assert.equal(val2.isInserting(), false);
  })

  .add('`attrChanged` returns whether the attribute changed', function () {
    var update = {foo: 'bar'}
      , val = Validator({}, update)
      , val2 = Validator({foo: 'zemba'}, update)
      , val3 = Validator({foo: 'bar'}, update);

    assert.equal(val.attrChanged('foo'), true);
    assert.equal(val2.attrChanged('foo'), true);
    assert.equal(val3.attrChanged('foo'), false);
  })

  .add('`getErrorBucket` gets or sets the error bucket for the attribute', function () {
    var update = {foo: 'bar'}
      , val = Validator({}, update);

    assert.deepEqual(val.errors, {});
    val.getErrorBucket('foo', true);
    assert.deepEqual(val.errors, {foo: []});
    assert.deepEqual(val.getErrorBucket('foo'), []);
    val.addError('foo', 'ERROR');
    assert.deepEqual(val.getErrorBucket('foo'), ['ERROR']);
  })

  .add('`getErrorBucket` also works with nested attributes', function () {
    var update = {'$set': {'foo.bar': 'zemba'}}
      , val = Validator({}, update);

    assert.deepEqual(val.errors, {});
    val.getErrorBucket('foo.bar', true);
    assert.deepEqual(val.errors, {foo: {bar: []}});
    assert.deepEqual(val.getErrorBucket('foo.bar'), []);
    val.addError('foo.bar', 'ERROR');
    assert.deepEqual(val.getErrorBucket('foo.bar'), ['ERROR']);
  })

  .add('`validateExistence` validates existence of attributes', function () {
    var update = {'$set': {hey: 'joe', 'foo.bar': 'zemba'}}
      , val = Validator({}, update);

    assert.deepEqual(val.hasErrors(), false);

    val.validateExistence({
      hey: 'hey error'
    , 'foo.bar': 'foo.bar error'
    , 'foo.boo': 'foo.boo error'
    , inexistant: 'inexistant error'
    });

    assert.ok(val.hasError('foo.boo'));
    assert.ok(val.hasError('inexistant'));
    assert.deepEqual(val.getErrorBucket('foo.boo'), ['foo.boo error']);
    assert.deepEqual(val.getErrorBucket('inexistant'), ['inexistant error']);
  })

  .add('`validateRegex` validates attributes matching regexes', function () {
    var update = {'$set': {hey: 'joe', 'foo.bar': 'zemba'}}
      , val = Validator({}, update);

    assert.deepEqual(val.hasErrors(), false);

    val.validateRegex({
      hey: [/joe/, 'hey error']
    , 'foo.bar': [/[0-9]+/, 'foo.bar error']
    , 'foo.boo': [/.*/, 'foo.boo error']
    , inexistant: [/.*/, 'inexistant error']
    });

    assert.equal(val.hasError('hey'), false);
    assert.ok(val.hasError('foo.bar'));
    assert.ok(val.hasError('foo.boo'));
    assert.ok(val.hasError('inexistant'));
    assert.deepEqual(val.getErrorBucket('foo.bar'), ['foo.bar error']);
    assert.deepEqual(val.getErrorBucket('foo.boo'), ['foo.boo error']);
    assert.deepEqual(val.getErrorBucket('inexistant'), ['inexistant error']);
  })

  .add('`validateConfirmation` validates attributes being equal', function () {
    var update = {'$set': {hey: 'joe', 'foo.bar': 'zemba', 'foo.boo': 'zemba'}}
      , val = Validator({}, update);

    assert.deepEqual(val.hasErrors(), false);

    val.validateConfirmation({
      hey: ['foo.cla', 'hey error']
    , 'foo.bar': ['foo.boo', 'foo.bar error']
    , inexistant: ['another inexistant', 'inexistant error']
    });

    assert.ok(val.hasError('hey'));
    assert.equal(val.hasError('foo.bar'), false);
    assert.ok(val.hasError('inexistant'));
    assert.deepEqual(val.getErrorBucket('hey'), ['hey error']);
    assert.deepEqual(val.getErrorBucket('inexistant'), ['inexistant error']);
  })

  .run();
