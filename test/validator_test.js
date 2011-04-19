var testosterone = require('testosterone')({sync: true, title: 'mongolia/validator.js'}),
    assert = testosterone.assert,
    gently = global.GENTLY = new (require('gently')),

    Validator = require('./../lib/validator')

testosterone

  .add('initial status', function () {
    var val = Validator({}, {foo: 'bar'}),
      val2 = Validator({foo: 'zemba', hey: 'joe'}, {foo: 'bar'});

    assert.deepEqual(val.errors, {});
    assert.deepEqual(val.model, {});
    assert.deepEqual(val.data, {foo: 'bar'});
    assert.deepEqual(val.updated_model, {foo: 'bar'});

    assert.deepEqual(val2.errors, {});
    assert.deepEqual(val2.model, {foo: 'zemba', hey: 'joe'});
    assert.deepEqual(val2.data, {foo: 'bar'});
    assert.deepEqual(val2.updated_model, {foo: 'bar', hey: 'joe'});
  })

  .add('`addError` adds a validation error', function () {
    var val = Validator({}, {foo: 'bar'});
    val.addError('foo', 'foo error');

    assert.equal(val.errors.foo[0], 'foo error');
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
    var val = Validator({}, {foo: 'bar'}),
        val2 = Validator({zemba: 'fleiba'}, {foo: 'bar'});
    assert.equal(val.isUpdating(), false);
    assert.equal(val2.isUpdating(), true);
  })

  .add('`isInserting` returns whether the model is being inserted', function () {
    var val = Validator({}, {foo: 'bar'}),
        val2 = Validator({zemba: 'fleiba'}, {foo: 'bar'});
    assert.equal(val.isInserting(), true);
    assert.equal(val2.isInserting(), false);
  })

  .run(function () {
    // zemba
  });
