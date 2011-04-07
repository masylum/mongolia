module.exports = function (db, collection_name) {

  if (!db) {
    throw (Error('You must specify a db'));
  }

  if (!collection_name) {
    throw (Error('You must specify a collection name'));
  }

  var MODEL = {db: db};

  /*
   * TODO: Documentation
   */
  MODEL.getCollection = function (callback) {
    db.collection(collection_name, callback);
  };

  /*
   * TODO: Documentation
   */
  MODEL.mongo = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        funk = args.shift(),
        callback = args[args.length - 1];

    MODEL.getCollection(function (error, collection) {
      if (error) {
        callback(error, null);
      } else {
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
  };

  /*
   * TODO: Documentation
   */
  MODEL.validateAndInsert = function (element, callback) {
    MODEL.validate({}, element, function (error, validator) {
      if (!validator.hasErrors()) {
        MODEL.onCreate(element, function (error, element) {
          MODEL.mongo('insert', element, function (error, element) {
            if (element) {
              validator.updated_model = element[0];
            }
            callback(error, validator);
          });
        });
      } else {
        callback(error, validator);
      }
    });
  };

  /*
   * TODO: Documentation
   */
  MODEL.onCreate = function (element, callback) {
    if (!element.created_at) {
      element.created_at = new Date();
    }

    if (callback) {
        callback(null, element);
    }
  };

  /*
   * TODO: Documentation
   */
  MODEL.afterCreate = function (element, callback) {
    if (callback) {
        callback(null, element);
    }
  };

  /*
   * TODO: Documentation
   */
  MODEL.validateAndUpdate = function (model, data, options, callback) {
    var update = {};

    if (typeof options === "function") {
      callback = options;
      options = {};
    }

    model.validate(model, data, function (errors, validator) {
      if (!validator.hasErrors()) {

        MODEL.onUpdate(model, data, function (errors, new_data) {
          update[options.verb || '$set'] = new_data;

          MODEL.mongoCall('update', {'_id': model._id}, update, { upsert: true, multi: false}, function (error, element) {
            callback(null, validator);
          });

        });

      } else {
        callback(null, validator);
      }
    });
  };

  /*
   * TODO: Documentation
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

  /*
   * TODO: Documentation
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
