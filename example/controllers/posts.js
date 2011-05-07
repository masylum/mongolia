module.exports = function (APP) {
  var app = APP.app,
      Post = APP.loadModel('post'),
      ObjectID = APP.ObjectID;

  // show post
  app.get('/posts/:id', function (req, res) {
    var id = req.param('id');

    Post().mongo('findOne', {_id: new ObjectID(id)}, function (error, document) {
      console.log('post:' + document);
      // Render with document 
    });
  });

  // create post
  app.post('/posts', function (req, res) {
    var document = req.param('post');

    Post().mongo('insert', document, function (error, document) {
      console.log('inserted post:' + document);
      // Render with document 
    });
  });

  // update post
  app.post('/posts/:id', function (req, res) {
    var id = req.param('id'),
        post = req.param('post');

    Post().mongo('update', {_id: id}, post, function (error, document) {
      console.log('updated post:' + document);
      // Render with document 
    });
  });

  // create comment
  app.post('/posts/:id/comments', function (req, res) {
    var id = req.param('id'),
        comment = req.param('comment');

    Post().add_comment(id, comment, function (error, document) {
      console.log('commented post:' + document);
      // Render with document 
    });
  });
};
