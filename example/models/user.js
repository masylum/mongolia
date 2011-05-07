module.exports = function (APP) {
  var USER = APP.model(APP.db, 'users'),
      Post = APP.loadModel('post');

  USER.validate = function (document, update, callback) {
    var validator = APP.validator(document);

    validator.validateRegex({
      name: [validator.regex.username, 'Incorrect name'],
      email: [validator.regex.email, 'Incorrect email'],
      password: [validator.regex.password, 'Incorrect password']
    });

    if (validator.attrChanged('password')) {
      validator.validateConfirmation({
        password: ['password_confirmation', 'Passwords must match']
      });
    }

    validator.validateQuery({
      name: [this, {name: update.name}, false, 'There is already a user with this name'],
      email: [this, {email: update.email}, false, 'There is already a user with this email']
    }, function () {
      callback(null, validator);
    });
  };

  USER.afterUpdate = function (documents, callback) {
    var funk = require('funk')();
    documents.forEach(function (document) {
      Post().updateEmbeddedDocument({'author._id': document._id}, 'author', document, {}, funk.nothing());
    });
    funk.parallel(callback);
  };

  return USER;
};
