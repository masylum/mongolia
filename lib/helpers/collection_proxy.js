var COLLECTION = {},
    _apply = function (collection, fn, args) {
      return collection[fn].apply(collection, args);
    };

COLLECTION.proxy = function (model, fn, collection, args, callback) {
  if (arguments.length < 5) {
    callback = function () {};
  }

  // overwritten method
  if (COLLECTION[fn] !== undefined) {
    return COLLECTION[fn](model, collection, args, callback);

  // driver method
  } else {
    args[args.length - 1] = callback;
    _apply(collection, fn, args);
  }
};

/**
 * Calls `find` + `toArray`
 *
 * @param {Object} model
 * @param {Object} collection
 * @param {Array} args
 * @param {Function} callback
 */
COLLECTION.findArray = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, cursor) {
    cursor.toArray(callback);
  };
  _apply(collection, 'find', args);
};

/**
 * Calls `insert`
 * and triggers the `beforeCreate` and `afterCreate` hooks
 *
 * @param {Object} model
 * @param {Object} collection
 * @param {Array} args
 * @param {Function} callback
 */
COLLECTION.insert = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, docs) {
    if (error) {
      callback(error, null);
    }
    model.afterCreate(docs, callback);
  };

  if (!Array.isArray(args[0])) {
    args[0] = [args[0]];
  }

  model.beforeCreate(args[0], function (error, documents) {
    if (error) {
      callback(error, null);
    }
    args[0] = documents;
    _apply(collection, 'insert', args);
  });
};

/**
 * Calls `findAndModify` or `update`
 * and triggers the `beforeUpdate` and `afterUpdate` hooks
 *
 * @param {Object} model
 * @param {Object} collection
 * @param {Array} args
 * @param {Function} callback
 */
['findAndModify', 'update'].forEach(function (method) {
  COLLECTION.findAndModify = COLLECTION.update = function (model, collection, args, callback) {
    args[args.length - 1] = function (error, docs) {
      if (error) {
        return callback(error, null);
      }
      model.afterUpdate(args[1], callback);
    };

    model.beforeUpdate(args[1], function (error, documents) {
      if (error) {
        return callback(error, null);
      }
      args[1] = documents;
      _apply(collection, method, args);
    });
  };
});

/**
 * Calls `remove`
 * and triggers the `beforeRemove` and `afterRemove` hooks
 *
 * @param {Object} model
 * @param {Object} collection
 * @param {Array} args
 * @param {Function} callback
 */
COLLECTION.remove = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, _) {
    if (error) {
      callback(error, null);
    }
    model.afterRemove(args[0], callback);
  };

  model.beforeRemove(args[0], function (error, documents) {
    if (error) {
      callback(error, null);
    }
    args[0] = documents;
    _apply(collection, 'remove', args);
  });
};

/**
 * Calls `mapReduce` + `find`
 *
 * @param {Object} model
 * @param {Object} collection
 * @param {Array} args
 * @param {Function} callback
 */
COLLECTION.mapReduceCursor = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, collection) {
    if (error) {
      callback(error, null);
    } else {
      collection.find(callback);
    }
  };
  _apply(collection, 'mapReduce', args);
};

/**
 * Calls `mapReduce` + `find` + `toArray`
 *
 * @param {Object} model
 * @param {Object} collection
 * @param {Array} args
 * @param {Function} callback
 */
COLLECTION.mapReduceArray = function (model, collection, args, callback) {
  COLLECTION.mapReduceCursor(collection, args, 'mapReduce', function (error, cursor) {
    if (error) {
      callback(error, null);
    } else {
      cursor.toArray(callback);
    }
  });
};

module.exports = COLLECTION;
