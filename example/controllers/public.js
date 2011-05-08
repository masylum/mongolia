module.exports = function (APP) {
  var app = APP.app
    , User = APP.loadModel('user')
    , Post = APP.loadModel('post')
    , Comment = APP.loadModel('comment');

  app.get('/', function (req, res) {
    var funk = require('funk')();

    Post().mongo('findArray', {}, funk.result('posts'));
    User().mongo('findArray', {}, funk.result('users'));
    Comment().mongo('findArray', {}, funk.result('comments'));

    funk.parallel(function () {
      if (this.errors) throw Error(this.errors[0]);

      res.render('public/index', {
        title: 'home'
      , users: this.users
      , posts: this.posts
      , comments: this.comments
      });
    });
  });
};
