var COLLECTION = {},
    _apply = function (collection, fn, args) {
      collection[fn].apply(collection, args);
    };

COLLECTION.proxy = function (model, fn, collection, args, callback) {
  if (COLLECTION[fn] !== undefined) {
    COLLECTION[fn](model, collection, args, callback);
  } else {
    args[args.length - 1] = callback;
    _apply(collection, fn, args);
  }
};

// TODO: docs
COLLECTION.findArray = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, cursor) {
    if (error) {
      return callback(error, null);
    }
    cursor.toArray(callback);
  };
  _apply(collection, 'find', args);
};

// TODO: docs
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

// TODO: docs
['findAndModify', 'update'].forEach(function (method) {
  COLLECTION.findAndModify = COLLECTION.update = function (model, collection, args, callback) {
    args[args.length - 1] = function (error, docs) {
      if (error) {
        callback(error, null);
      }
      model.afterUpdate(args[1], callback);
    };

    model.beforeUpdate(args[0], function (error, documents) {
      if (error) {
        callback(error, null);
      }
      args[0] = documents;
      _apply(collection, method, args);
    });
  };
});

// TODO: docs
COLLECTION.remove = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, docs) {
    if (error) {
      callback(error, null);
    }
    model.afterRemove(docs, callback);
  };

  model.beforeRemove(args[0], function (error, documents) {
    if (error) {
      callback(error, null);
    }
    args[0] = documents;
    _apply(collection, 'remove', args);
  });
};

// TODO: docs
COLLECTION.mapReduceCursor = function (model, collection, args, callback) {
  args[args.length - 1] = function (error, collection) {
    collection.find(callback);
  };
  _apply(collection, 'mapReduce', args);
};

// TODO: docs
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
