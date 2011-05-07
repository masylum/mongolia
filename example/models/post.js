module.exports = function (APP) {
  var POST = APP.model(APP.db, 'posts'),
      Comment = APP.loadModel('comment');

  POST.skeletons = {
    author: ['_id', 'name'],
    comments: ['_id', 'body']
  };
  
  POST.validate = function (document, update, callback) {
    var validator = APP.validator(document);

    validator.validateExistence({
      title: 'Title is mandatory',
      body: 'Body is mandatory',
      author: 'A Post needs an author'
    });

    callback(null, validator);
  };

  POST.add_comment = function (id, document, callback) {
    POST.mongo('findOne', {_id: id}, function (error, doc) {
      if (error) {
        return callback(error);
      }
      document.post = doc;
      Comment(APP).mongo('insert', document, callback);
    });
  };

  POST.afterUpdate = function (documents, callback) {
    var funk = require('funk')();
    documents.forEach(function (document) {
      Comment(APP).updateEmbeddedDocument({'post._id': document._id}, 'post', document, {}, funk.nothing());
    });
    funk.parallel(callback);
  };

  return POST;
};
