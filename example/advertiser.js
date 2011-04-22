var User = require('./user');

module.exports = function (db) {
  var ADVERTISER = User(db);

  ADVERTISER.beforeCreate = function (elements, callback) {
    elements.forEach(function (element) {
      element.created_at = new Date();
      element.is_deleted = false;
      element.last_login_at = null;
      element.updated_at = null;
    });

    callback(null, elements);
  };

  return ADVERTISER;
};

