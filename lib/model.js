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
        funk = args.shift(),
        callback = args[args.length - 1];

    MODEL.getCollection(function (error, collection) {
      if (error) {
        callback(error, null);
      } else {
        // TODO: Separate this logic in a `custom_collection` class
        switch (funk) {
        case 'findArray':
          args[args.length - 1] = function (error, cursor) {
            cursor.toArray(callback);
          };
          funk = 'find';
          break;
        case 'insert':
          if (Array.isArray(args[0])) {
            args[0].forEach(function (element) {
              MODEL.onCreate(element);
            });
          } else {
            MODEL.onCreate(args[0]);
          }

          args[args.length - 1] = function (error, docs) {
            docs.forEach(function (element) {
              MODEL.afterCreate(element);
            });
            callback(error, docs);
          };
          break;
        case 'update':
        case 'findAndModify':
          MODEL.onUpdate(args[1]);
          break;
        case 'mapReduceArray':
          args[args.length - 1] = function (error, collection) {

            collection.find(function (error, cursor) {
              var results = [];

              if (error) {
                callback(error);
              } else {
                cursor.each(function (error, item) {
                  if (error) {
                    callback(error);
                  } else {
                    if (item) {
                      results.push(Object.merge(item._id, item.value));
                    } else {
                      callback(null, results);
                    }
                  }
                });
              }

            });
          };
          funk = 'mapReduce';
          break;
        case 'mapReduceCursor':
          args[args.length - 1] = function (error, collection) {
            collection.find(callback);
          };
          funk = 'mapReduce';
          break;
        }
        collection[funk].apply(collection, args);
      }
    });

    return MODEL;
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
  MODEL.onCreate = function (document, callback) {
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
   * Validates a mongo document and updates it
   *
   * @param {Object} document
   * @param {Object} update
   * @param {Object} options
   * @param {Function} callback
   * @returns itself
   */
  MODEL.validateAndUpdate = function (document, update, options, callback) {
    var update = {};

    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    MODEL.validate(document, update, function (errors, validator) {
      if (!validator.hasErrors()) {

        MODEL.onUpdate(document, update, function (errors, new_document) {
          update[options.verb || '$set'] = new_document;

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
   * Hook triggered before updating a document
   *
   * @param {Object} update
   * @param {Function} callback
   */
  MODEL.onUpdate = function (update, callback) {
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
    // to implement
    if (callback) {
        callback(null, element);
    }
  };

  /*
   * TODO: Documentation
   */
  MODEL.setEmbedObject = function (name, object) {
    var result = {};

    this.skeletons[name].forEach(function (attr) {
      result[attr] = object[attr];
    });

    return result;
  };

  /*
   * TODO: Documentation
   */
  MODEL.updateEmbedObject = function (model, data, embed, options, callback) {
    var new_data = {},
        i,
        query = {};

    query[embed + '._id'] = model._id;

    for (i in data) {
      new_data[embed + '.' + i] = data[i];
    }

    this.mongoCall('update', query, {'$set': new_data}, options || {upsert: true, multi: true}, callback);
  };

  /*
   * TODO: Documentation
   */
  MODEL.pushEmbedObject = function (model, data, embed, options, callback) {
    var new_data = {},
        i,
        query = {};

    query[embed + '._id'] = model._id;

    for (i in data) {
      new_data[embed + '.' + i] = data[i];
    }

    this.mongoCall('update', query, {'$push': new_data}, options || {upsert: true, multi: true}, callback);
  };

  return model;
};
