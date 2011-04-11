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
        fn = args.shift(),
        collection_proxy = require('./helpers/collection_proxy'),
        callback = args[args.length - 1];

    MODEL.getCollection(function (error, collection) {
      if (error) {
        callback(error, null);
      } else {
        collection_proxy.proxy(fn, collection, args, callback);
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
    callback(null, require('mongolia').validator(document, data));
  }

  /**
   * Validates a mongo document and inserts it
   *
   * @param {Object} document
   * @param {Function} callback
   * @returns itself
   */
  MODEL.validateAndInsert = function (document, callback) {
    MODEL.validate({}, document, function (error, validator) {
      if (!validator.hasErrors()) {
        MODEL.onCreate(document, function (error, document) {
          MODEL.mongo('insert', document, function (error, document) {
            if (document) {
              validator.updated_model = document[0];
            }
            callback(error, validator);
          });
        });
      } else {
        callback(error, validator);
      }
    });

    return MODEL;
  };

  /**
   * Hook triggered before inserting a document
   *
   * @param {Object} document
   * @param {Function} callback
   */
  MODEL.beforeCreate = function (document, callback) {
    if (!document.created_at) {
      document.created_at = new Date();
    }

    if (callback) {
      callback(null, document);
    }
  };

  /**
   * Hook triggered after inserting a document
   *
   * @param {Object} document
   * @param {Function} callback
   */
  MODEL.afterCreate = function (document, callback) {
    if (callback) {
      callback(null, document);
    }
  };

  /**
   * Hook triggered before updating a document
   *
   * @param {Object} update
   * @param {Function} callback
   */
  MODEL.beforeUpdate = function (update, callback) {
    if (!update.$set) {
      update.$set = {};
    }

    update.$set.updated_at = new Date();

    if (callback) {
      callback(null, element);
    }
  };

  /**
   * Hook triggered after updating a document
   *
   * @param {Object} update
   * @param {Function} callback
   */
  MODEL.afterUpdate = function (update, callback) {
    if (callback) {
      callback(null, element);
    }
  };

  /**
   * Hook triggered before removing a document
   *
   * @param {Object} document
   * @param {Function} callback
   */
  MODEL.beforeRemove = function (document, callback) {
    if (callback) {
      callback(null, element);
    }
  };

  /**
   * Hook triggered after removing a document
   *
   * @param {Object} document
   * @param {Function} callback
   */
  MODEL.afterRemove = function (document, callback) {
    if (callback) {
      callback(null, element);
    }
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
    var update = {};

    // options are optional
    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    options = utils.merge(options, {upsert: true, multi: false, verb: '$set'});

    MODEL.validate(document, update, function (errors, validator) {
      if (!validator.hasErrors()) {

        MODEL.onUpdate(document, update, function (errors, new_document) {
          update[options.verb] = new_document;

          MODEL.mongoCall('update', {'_id': document._id}, update, { upsert: true, multi: false}, function (error, element) {
            callback(null, validator);
          });

        });

      } else {
        callback(null, validator);
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
   *
   * @returns document with applied skeleton
   */
  MODEL.getEmbeddedDocument = function (name, document, scope) {
    var result = {};

    this.skeletons[name].forEach(function (attr) {
      result[(scope ? scope + '.' : '') + attr] = document[attr];
    });

    return result;
  };

  /**
   * Update all the embedded objects
   *
   * @param {ObjectID} id
   *   Id of the document to be updated
   * @param {String} document_name
   *   Name for the document embedding
   * @param {Object} document
   *   Document to be embedded
   * @param {Object} options
   *   Update options. Defaults to {upsert: true, multi: true}
   * @param {Function} callback
   *
   * @returns itself
   */
  MODEL.updateEmbeddedDocument = function (id, document_name, document, options, callback) {
    var update = MODEL.getEmbeddedDocument(document_name, document, document_name),
        query = {};

    options = utils.merge(options, {upsert: true, multi: true});
    query[document_name + '._id'] = id;

    MODEL.mongo('update', query, {'$set': update}, options, callback);

    return MODEL;
  };

  /**
   * Push an embedded object
   *
   * @param {ObjectID} id
   *   Id of the document to be updated
   * @param {String} document_name
   *   Name for the document embedding
   * @param {Object} document
   *   Document to be embedded
   * @param {Object} options
   *   Update options. Defaults to {upsert: true, multi: true}
   * @param {Function} callback
   *
   * @returns itself
   */
  MODEL.pushEmbeddedDocument = function (id, document_name, document, options, callback) {
    var update = MODEL.getEmbeddedDocument(document_name, document, document_name),
        query = {};

    options = utils.merge(options, {upsert: true, multi: true});
    query[document_name + '._id'] = id;

    MONGO.mongo('update', query, {'$push': update}, options, callback);

    return MODEL;
  };

  return MODEL;
};
