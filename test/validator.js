/**
 * Module dependencies.
 */

var validator = require('./../lib/validator');

module.exports['test initial status'] = function (assert) {
  var val = validator({}, {foo: 'bar'}),
      val2 = validator({foo: 'zemba', hey: 'joe'}, {foo: 'bar'});

  assert.eql(val.errors, {});
  assert.eql(val.model, {});
  assert.eql(val.data, {foo: 'bar'});
  assert.eql(val.updated_model, {foo: 'bar'});

  assert.eql(val2.errors, {});
  assert.eql(val2.model, {foo: 'zemba', hey: 'joe'});
  assert.eql(val2.data, {foo: 'bar'});
  assert.eql(val2.updated_model, {foo: 'bar', hey: 'joe'});
};

// errors
module.exports['test addError'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo', 'foo error');

  assert.includes(val.errors.foo, 'foo error');
};

module.exports['test hasErrors'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo', 'foo error');

  assert.equal(val.hasErrors(), true);
};

module.exports['test hasError'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo', 'foo error');

  assert.equal(val.hasError('foo'), true);
};

// nested errors
module.exports['test nested addError'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo.zemba', 'foo error');

  assert.includes(val.errors.foo.zemba, 'foo error');
};

module.exports['test hasErrors'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo.zemba', 'foo error');

  assert.equal(val.hasErrors(), true);
};

module.exports['test hasError'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo.zemba', 'foo error');

  assert.equal(val.hasError('foo.zemba'), true);
};

// multiple errors per field
module.exports['test multiple errors per field'] = function (assert) {
  var val = validator({}, {foo: 'bar'});
  val.addError('foo.zemba', 'error1');

  assert.equal(val.hasError('foo.zemba'), true);

  val.addError('foo.zemba', 'error2');
  assert.eql(val.errors.foo.zemba, ['error1', 'error2']);
  assert.equal(val.hasError('foo.zemba'), true);

  val.addError('foo.bla', 'error3');
  assert.eql(val.errors.foo.zemba, ['error1', 'error2']);
  assert.eql(val.errors.foo.bla, ['error3']);
};
