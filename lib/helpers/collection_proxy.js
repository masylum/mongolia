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
  args[args.length - 1] = function (error, ret) {
    if (error) {
      return callback(error, null);
    }
    if (model.afterCreate.length === 1) {
      model.afterCreate(args[0]);
      callback(null, ret);
    } else {
      model.afterCreate(args[0], function (error, _) {
        callback(error, ret);
      });
    }
  };

  if (!Array.isArray(args[0])) {
    args[0] = [args[0]];
  }

  if (model.beforeCreate.length === 1) {
    model.beforeCreate(args[0]);
    _apply(collection, 'insert', args);
  } else {
    model.beforeCreate(args[0], function (error, _) {
      if (error) {
        return callback(error, null);
      }
      _apply(collection, 'insert', args);
    });
  }
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
  COLLECTION[method] = function (model, collection, args, callback) {
    var update_index = method === 'update' ? 1 : 2;

    args[args.length - 1] = function (error, ret) {
      if (error) {
        return callback(error, null);
      }
      if (model.afterUpdate.length === 2) {
        model.afterUpdate(args[0], args[update_index]);
        callback(null, ret);
      } else {
        model.afterUpdate(args[0], args[update_index], function (error, _) {
          callback(error, ret);
        });
      }
    };

    if (!args[1].$set) {
      args[1].$set = {};
    }

    if (model.beforeUpdate.length === 2) {
      model.beforeUpdate(args[0], args[update_index]);
      _apply(collection, method, args);
    } else {
      model.beforeUpdate(args[0], args[update_index], function (error, _) {
        if (error) {
          return callback(error, null);
        }
        _apply(collection, method, args);
      });
    }
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
  args[args.length - 1] = function (error, ret) {
    if (error) {
      return callback(error, null);
    }
    if (model.afterRemove.length === 1) {
      model.afterRemove(args[0]);
      callback(null, ret);
    } else {
      model.afterRemove(args[0], function (error, _) {
        callback(error, ret);
      });
    }
  };

  if (model.beforeRemove.length === 1) {
    model.beforeRemove(args[0]);
    _apply(collection, 'remove', args);
  } else {
    model.beforeRemove(args[0], function (error, _) {
      if (error) {
        return callback(error, null);
      }
      _apply(collection, 'remove', args);
    });
  }
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
