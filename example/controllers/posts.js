module.exports = function (APP) {
  var app = APP.app;

  // show post
  app.get('/posts/:id', function (req, res) {
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
