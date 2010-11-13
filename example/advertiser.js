var User = require('./user');

module.exports = function (db) {
  var advertiser = User(db);

  advertiser.onCreate = function (element) {
    element.created_at    = new Date();
    element.is_deleted    = false;
    element.last_login_at = null;
    element.updated_at    = null;
  };

  return advertiser;
};

