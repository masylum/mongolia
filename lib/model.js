if (global.GENTLY) {
  require = global.GENTLY.hijack(require);
}

var utils = require('./utils');

module.exports = function (db, collection_name) {

  if (!db) {
    throw (Error('You must specify a db'));
  }

  if (!collection_name) {
    throw (Error('You must specify a collection name'));
  }

  var MODEL = {db: db};

  /**
   * Gets and caches the mongo collection
   *
   * @param {Function} callback
   * @returns itself
   */
  MODEL.getCollection = function (callback) {
    db.collection(collection_name, callback);

    return MODEL;
  };

  /**
   * Proxies `collection` calls by triggering the proper hooks
   *
   * Adds custom `findArray`, `mapReduceCursor` and `mapReduceArray`.
   *
   * @param {String} function name
   * @param {Mixed} options
   * @param {Function} callback
   * @returns itself
   */
  MODEL.mongo = function (fn, options, callback) {
    var args = Array.prototype.slice.call(arguments, 0),
        collection_proxy = require('./helpers/collection_proxy');

    fn = args.shift();

    callback = args[args.length - 1];
    if (typeof callback !== 'function') {
      callback = function () {};
    }

    MODEL.getCollection(function (error, collection) {
      if (error) {
        callback(error, null);
      } else {
        collection_proxy.proxy(MODEL, fn, collection, args, callback);
      }
    });

    return MODEL;
  };

  /**
   * Validates a mongo document
   *
   * @param {Object} document
   * @param {Object} update
   * @param {Function} callback
   */
  MODEL.validate = function (document, update, callback) {
    var validator = require('./validator')(document, update);
    callback(null, validator);
  };

  /**
   * Validates a mongo document and inserts it
   *
   * @param {Object} document
   * @param {Function} callback
   * @returns itself
   */
  MODEL.validateAndInsert = function (document, callback) {
    MODEL.validate({}, document, function (error, validator) {
      if (validator.hasErrors()) {
        callback(error, validator);
      } else {
        MODEL.mongo('insert', document, function (error, documents) {
          if (documents) {
            validator.updated_model = documents[0];
          }
          callback(error, validator);
        });
      }
    });

    return MODEL;
  };

  /**
   * Hook triggered before inserting a document
   *
   * @param {Array} documents
   * @param {Function} callback
   */
  MODEL.beforeCreate = function (documents, callback) {
    documents.forEach(function (document) {
      if (!document.created_at) {
        document.created_at = new Date();
      }
    });
    callback(null, documents);
  };

  /**
   * Hook triggered after inserting a document
   *
   * @param {Array} documents
   * @param {Function} callback
   */
  MODEL.afterCreate = function (documents, callback) {
    callback(null, documents);
  };

  /**
   * Hook triggered before updating a document
   *
   * @param {Object} query
   * @param {Object} update
   * @param {Function} callback
   */
  MODEL.beforeUpdate = function (query, update, callback) {
    update.$set.updated_at = new Date();
    callback(null, query, update);
  };

  /**
   * Hook triggered after updating a document
   *
   * @param {Object} query
   * @param {Object} update
   * @param {Function} callback
   */
  MODEL.afterUpdate = function (query, update, callback) {
    callback(null, query, update);
  };

  /**
   * Hook triggered before removing a document
   *
   * @param {Object} query
   * @param {Function} callback
   */
  MODEL.beforeRemove = function (query, callback) {
    callback(null, query);
  };

  /**
   * Hook triggered after removing a document
   *
   * @param {Object} query
   * @param {Function} callback
   */
  MODEL.afterRemove = function (query, callback) {
    callback(null, query);
  };

  /**
   * Validates a mongo document and updates it
   *
   * @param {Object} document
   *   Document to uodate
   * @param {Object} update
   *   Update object
   * @param {Object} options
   *   Update options. Defaults to {upsert: true, multi: false, verb: '$set'}
   * @param {Function} callback
   *   The callback returns a validator
   *
   * @returns itself
   */
  MODEL.validateAndUpdate = function (document, update, options, callback) {
    // options are optional
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    options = utils.merge(options, {upsert: true, multi: false, verb: '$set'});

    MODEL.validate(document, update, function (error, validator) {
      if (validator.hasErrors()) {
        callback(error, validator);
      } else {
        MODEL.mongo('update', {'_id': document._id}, update, options, function (error, doc) {
          callback(error, validator);
        });
      }
    });

    return MODEL;
  };

  /**
   * Get the document ready to embed to this model according to the skeleton
   *
   * @param {String} name
   * @param {Object} document
   * @param {String} scope
   *   Optional field to scope the resulting document
   * @param {Boolean} dot_notation
   *   Return the nested object or using dot_notation ready for mongo
   *
   * @returns document with applied skeleton
   */
  MODEL.getEmbeddedDocument = function (name, document, scope, dot_notation) {
    var result = {},
        last = result,
        filter = function (attr) {
          last[dot_notation ? ((scope ? scope + '.' : '') + attr) : attr] = document[attr];
        };

    if (scope && !dot_notation) {
      scope.split('.').forEach(function (level) {
        last = last[level] = {};
      });
    }

    if (this.skeletons && this.skeletons[name]) {
      this.skeletons[name].forEach(filter);
    } else {
      Object.keys(document).forEach(filter);
    }

    return result;
  };

  /**
   * Update all the embedded objects
   *
   * @param {ObjectID} id
   *   Id of the embedded document to be updated
   * @param {String} document_name
   *   Name for the embedded document
   * @param {Object} document
   *   Document to be embedded
   * @param {Object} options
   *   Update options. Defaults to {upsert: true, multi: true}
   * @param {Function} callback
   *
   * @returns itself
   */
  MODEL.updateEmbeddedDocument = function (query, document_name, document, options, callback) {
    var update = MODEL.getEmbeddedDocument(document_name, document, document_name, true),
        scoped_query = {};

    options = utils.merge(options, {upsert: true, multi: true});
    Object.keys(query).forEach(function (attr) {
      scoped_query[document_name + '.' + attr] = query[attr];
    });

    MODEL.mongo('update', scoped_query, {'$set': update}, options, callback);

    return MODEL;
  };

  /**
   * Push an embedded object
   *
   * @param {Object} query
   *   Query to match the objects to push the embedded doc
   * @param {String} document_name
   *   Name for the embedded document array
   * @param {Object} document
   *   Document to be push
   * @param {Object} options
   *   Update options. Defaults to {upsert: true, multi: true}
   * @param {Function} callback
   *
   * @returns itself
   */
  MODEL.pushEmbeddedDocument = function (query, document_name, document, options, callback) {
    var update = MODEL.getEmbeddedDocument(document_name, document, document_name, true);

    options = utils.merge(options, {upsert: true, multi: true});

    MODEL.mongo('update', query, {'$push': update}, options, callback);

    return MODEL;
  };

  return MODEL;
};
