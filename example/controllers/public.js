module.exports = function (APP) {
  var app = APP.app,
      User = APP.loadModel('user'),
      Post = APP.loadModel('post');

  app.get('/', function (req, res) {
    Post().mongo('findArray', {}, function (error, documents) {
      console.log('posts:' + documents);
      // Render with document 
    });
    User().mongo('findArray', {}, function (error, documents) {
      console.log('users:' + documents);
      // Render with document 
    });
  });
};
