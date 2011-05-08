module.exports = function (APP) {
  var COMMENT = APP.model(APP.db, 'comments'),
      Post = APP.loadModel('post');

  COMMENT.skeletons = {
    post: ['_id', 'title']
  };

  COMMENT.validate = function (document, update, callback) {
    var validator = APP.validator(document, update);

    validator.validateExistence({
      body: 'Body is mandatory',
      post: 'A comment needs a post'
    });

    callback(null, validator);
  };

  COMMENT.afterInsert = function (documents, callback) {
    var funk = require('funk')();

    documents.forEach(function (document) {
      Post().pushEmbeddedDocument({_id: document.post._id}, 'comments', document, funk.nothing());
    });

    funk.parallel(callback);
  };

  return COMMENT;
};
