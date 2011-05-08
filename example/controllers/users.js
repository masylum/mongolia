module.exports = function (APP) {
  var app = APP.app
    , User = APP.loadModel('user')
    , ObjectID = APP.ObjectID;

  // show user
  app.get('/users/:id', function (req, res) {
    var id = req.param('id');

    User().mongo('findOne', {_id: new ObjectID(id)}, function (error, user) {
      if (error) throw error;

      res.render('users/show', {
        title: 'Paco'
      , user: user
      , posts: user.posts
      });
    });
  });

  // create user
  app.post('/users', function (req, res) {
    var document = req.param('user');

    User().getCollection(function (error, collection) {
      document._id = collection.pkFactory.createPk();

      User().validateAndInsert(document, function (error, validator) {
        if (error) throw error;

        if (validator.hasErrors()) {
          // Show flash error
          console.log(validator.errors);
          res.redirect('/');
        } else {
          res.redirect('/users/' + document._id + '/');
        }
      });
    });
  });

  // update user
  app.post('/users/:id', function (req, res) {
    var id = req.param('id')
      , update = req.param('user');

    User().validateAndUpdate({_id: new ObjectID(id)}, {'$set': update}, function (error, validator) {
      if (error) throw error;
      if (validator.hasErrors()) console.log(validator.errors);

      res.redirect('/users/' + id + '/');
    });
  });
};
