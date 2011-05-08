module.exports = function (APP) {
  var USER = APP.model(APP.db, 'users'),
      Post = APP.loadModel('post');

  USER.validate = function (document, update, callback) {
    var validator = APP.validator(document, update);

    validator.validateRegex({
      name: [/[a-zA-Z_\s]{3,20}/, 'Incorrect name'],
      email: [validator.regex.email, 'Incorrect email'],
      password: [validator.regex.password, 'Incorrect password']
    });

    if (validator.attrChanged('password')) {
      validator.validateConfirmation({
        password: ['password_confirmation', 'Passwords must match']
      });
    }

    if (!validator.isUpdating()) {
      validator.validateQuery({
        name: [this, {name: update.name}, false, 'There is already a user with this name'],
        email: [this, {email: update.email}, false, 'There is already a user with this email']
      }, function () {
        callback(null, validator);
      });
    } else {
      callback(null, validator);
    }
  };

  USER.afterUpdate = function (query, update, callback) {
    Post().updateEmbeddedDocument({'_id': query._id}, 'author', update, callback);
  };

  return USER;
};
