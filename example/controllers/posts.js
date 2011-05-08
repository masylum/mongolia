module.exports = function (APP) {
  var app = APP.app
    , User = APP.loadModel('user')
    , Post = APP.loadModel('post')
    , ObjectID = APP.ObjectID

    , embedAuthor = function (document, callback) {
        User().mongo('findOne', {_id: new ObjectID(document.author._id)}, function (error, user) {
          if (error) callback(error);

          document.author = Post().getEmbeddedDocument('author', user);
          callback(null, document);
        });
      };

  // show post
  app.get('/posts/:id', function (req, res) {
    var id = req.param('id')
      , funk = require('funk')();

    User().mongo('findArray', {}, funk.result('users'));
    Post().mongo('findOne', {_id: new ObjectID(id)}, funk.result('post'));

    funk.parallel(function () {
      res.render('posts/show', {
        title: this.post.title
      , post: this.post
      , users: this.users
      });
    });
  });

  // create post
  app.post('/posts', function (req, res) {
    var document = req.param('post')
      , funk = require('funk')();

    Post().getCollection(funk.add(function (error, collection) {
      document._id = collection.pkFactory.createPk();
    }));
    embedAuthor(document, funk.nothing());

    funk.parallel(function () {
      Post().validateAndInsert(document, function (error, validator) {
        if (error) throw error;

        if (validator.hasErrors()) {
          // Show flash error
          console.log(validator.errors);
          res.redirect('/');
        } else {
          res.redirect('/posts/' + document._id + '/');
        }
      });
    });
  });

  // update post
  app.post('/posts/:id', function (req, res) {
    var id = req.param('id')
      , update = req.param('post');

    embedAuthor(update, function (error, update) {
      Post().validateAndUpdate({_id: new ObjectID(id)}, {'$set': update}, function (error, validator) {
        if (error) throw error;
        if (validator.hasErrors()) console.log(validator.errors);

        res.redirect('/posts/' + id + '/');
      });
    });
  });

  // create comment
  app.post('/posts/:id/comments', function (req, res) {
    var id = req.param('id')
      , comment = req.param('comment');

    Post().mongo('findOne', {_id: new ObjectID(id)}, function (error, post) {
      if (error) throw error;
      Post().addComment(post, comment, function (error, document) {
        if (error) throw error;
        res.redirect('/posts/' + id + '/');
      });
    });
  });
};
