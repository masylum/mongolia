var Model= require('./../model');

var User = Model.extend({
  constructor: function (db) {
    Model.call(this, db, 'users');
  },

  validate: function (user, data, callback) {
    var validator= $.model('validator', [user, data]);

    validator.validateRegex({
      name: [validator.regex.username, 'Incorrect name'],
      email: [validator.regex.email, 'Incorrect email'],
      password: [validator.regex.password, 'Incorrect password'],
      description: [validator.regex.description, 'Incorrect description']
    });

    if(validator.attrChanged('password')) {
      validator.validateConfirmation({
        'password': ['password_confirmation', 'Passwords must match']
      });
    }

    if(!data.tags || data.tags.length <= 0) {
      validator.addError('tags', 'Select at least one tag');
    }

    validator.validateQuery({
      name: [this, {name: data.name}, false, 'There is already a user with this name'],
      email: [this, {email: data.email}, false, 'There is already a user with this email']
    }, function () {
      callback(null, validator);
    });
  }
});

module.exports = User;
