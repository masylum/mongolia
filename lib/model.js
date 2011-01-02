module.exports = function (db, collection_name) {

  if (!db) {
    throw (new Error('You must specify a db'));
  }

  if (!collection_name) {
    throw (new Error('You must specify a collection name'));
  }

  var model = {};

  model.getCollection = function (callback) {
    db.collection(collection_name, function (error, collection) {
      if (error) {
        callback(error);
      } else {
        callback(null, collection);
      }
    });
  };

  model.mongoCall = function () {
    var args = Array.prototype.slice.call(arguments, 0),
        funk = args.shift(),
        callback = args[args.length - 1];

    this.getCollection(function (error, collection) {
      if (error) {
        callback(error);
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
              model.onCreate(element);
            });
          } else {
            model.onCreate(args[0]);
          }

          args[args.length - 1] = function (error, docs) {
            docs.forEach(function (element) {
              model.afterCreate(element);
            });
            callback(error, docs);
          };
          break;
        case 'update':
        case 'findAndModify':
          model.onUpdate(args[1]);
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

  model.createInstance = function (element, callback) {
    model.validate({}, element, function (error, validator) {
      if (!validator.hasErrors()) {
        model.onCreateInstance(element, function (error, element) {
          model.mongoCall('insert', element, function (error, element) {
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

  model.onCreate = function (element) {
    if (!element.created_at) {
      element.created_at = new Date();
    }
  };

  model.afterCreate = function (element) {
    // to implement on your models
  };

  model.onCreateInstance = function (element, callback) {
    // to implement on your models
    callback(null, element);
  };

  model.updateInstance = function (model, data, options, callback) {
    var update = {};

    if (typeof options === "function") {
      callback = options;
      options = {};
    }


    model.validate(model, data, function (errors, validator) {
      if (!validator.hasErrors()) {
        model.onUpdateInstance(model, data, function (errors, new_data) {

          update[options.verb || '$set'] = new_data;

          model.mongoCall('update', {'_id': model._id}, update, { upsert: true, multi: false}, function (error, element) {
            callback(null, validator);
          });
        });
      } else {
        callback(null, validator);
      }
    });
  };

  model.onUpdate = function (update) {
    if (!update.$set) {
      update.$set = {};
    }
    update.$set.updated_at = new Date();
  };

  model.onUpdateInstance = function (model, update, callback) {
    // to implement
    callback(null, update);
  };

  model.setEmbedObject = function (name, object) {
    var result = {};

    this.skeletons[name].forEach(function (attr) {
      result[attr] = object[attr];
    });

    return result;
  };

  model.updateEmbedObject = function (model, data, embed, options, callback) {
    var new_data = {},
        i,
        query = {};

    query[embed + '._id'] = model._id;

    for (i in data) {
      new_data[embed + '.' + i] = data[i];
    }

    this.mongoCall('update', query, {'$set': new_data}, options || {upsert: true, multi: true}, callback);
  };

  model.pushEmbedObject = function (model, data, embed, options, callback) {
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
