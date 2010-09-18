var User = require('./user');

var Advertiser = User.extend({
  onCreate: function (element) {
    element.created_at    = new Date();
    element.is_deleted    = false;
    element.last_login_at = null;
    element.updated_at    = null;
  },
});

module.exports = Advertiser;
