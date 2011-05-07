module.exports = function (APP) {
  var app = APP.app;

  // show user
  app.get('/users/:id', function (req, res) {
    res.render('users/show', {
      title: 'Paco',
      user: {name: 'Paco', email: 'fleiba@zemba.com', _id: 1, password: 'asdf'},
      posts: [{_id: 1, title: 'How I made 300$ with zemba'}, {_id: 2, title: 'Random: The best 10 fleibas in the world'}]
    });
  });

  // create user
  app.post('/users', function (req, res) {
  });

  // update user
  app.post('/users/:id', function (req, res) {
  });
};

