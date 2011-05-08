module.exports = function (APP) {
  var POST = APP.model(APP.db, 'posts'),
      Comment = APP.loadModel('comment'),
      ObjectID = APP.ObjectID;

  POST.skeletons = {
    author: ['_id', 'name'],
    comments: ['_id', 'body']
  };

  POST.validate = function (document, update, callback) {
    var validator = APP.validator(document, update);

    validator.validateExistence({
      title: 'Title is mandatory',
      body: 'Body is mandatory',
      author: 'A Post needs an author'
    });

    callback(null, validator);
  };

  POST.addComment = function (post, comment, callback) {
    comment.post = Comment().getEmbeddedDocument('post', post);
    Comment().validateAndInsert(comment, callback);
  };

  POST.afterUpdate = function (query, update, callback) {
    Comment().updateEmbeddedDocument({_id: query._id}, 'post', update, {}, callback);
  };

  return POST;
};
