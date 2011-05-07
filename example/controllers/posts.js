module.exports = function (APP) {
  var app = APP.app;

  // show post
  app.get('/posts/:id', function (req, res) {
    res.render('posts/show', {
      title: 'Post fleiba',
      post: {
        _id: 1,
        title: 'How I made 300$ with zemba',
        body: 'fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba, fleiba que te fleiba',
        author: {name: 'Paco', email: 'fleiba@zemba.com', _id: 1, password: 'asdf'},
        comments: [{body: 'Functions are the main building block of JavaScript. Functions define the behaviour of things like closures, ‘this’, global variables vs. local variables… Understanding the functions is the first step to truly understand how JavaScript works'}, {body: 'Just trolling'}, {body: 'Fuck yeah!'}]
      }
    });
  });

  // create post
  app.post('/posts', function (req, res) {
  });

  // update post
  app.post('/posts/:id', function (req, res) {
  });

  // create comment
  app.post('/posts/:id/comments', function (req, res) {
  });
};
