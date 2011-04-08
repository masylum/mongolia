var COLLECTION = {},
    _apply = function (collection, fn, args) {
      collection[fn].apply(collection, args);
    };

COLLECTION.proxy = function (fn, collection, args, callback) {
  COLLECTION[fn](collection, args, fn, callback);
}

// TODO: docs
COLLECTION.findArray = function (collection, args, fn, callback) {
  args[args.length - 1] = function (error, cursor) {
    cursor.toArray(callback);
  };
  _apply(collection, 'find', args);
};

// TODO: docs
COLLECTION.insert = function (collection, args, fn, callback) {
  args[args.length - 1] = function (error, docs) {
    if (error) {
      callback(error, null);
    }
    MODEL.afterCreate(docs, callback);
  };

  if (!Array.isArray(args[0])) {
    args[0] = [args[0]];
  }

  MODEL.beforeCreate(args[0], function (error, documents) {
    if (error) {
      callback(error, null);
    }
    args[0] = documents;
    _apply(collection, fn, args);
  });
};

// TODO: docs
COLLECTION.findAndModify = COLLECTION.update = function (collection, args, fn, callback) {
  args[args.length - 1] = function (error, docs) {
    if (error) {
      callback(error, null);
    }
    MODEL.afterUpdate(element, callback);
  };

  MODEL.beforeUpdate(args[0], function (error, documents) {
    if (error) {
      callback(error, null);
    }
    args[0] = documents;
    _apply(collection, fn, args);
  });
};

// TODO: docs
COLLECTION.remove = function (collection, args, fn, callback) {
  args[args.length - 1] = function (error, docs) {
    if (error) {
      callback(error, null);
    }
    MODEL.afterRemove(docs, callback);
  };

  MODEL.beforeRemove(args[0], function (error, documents) {
    if (error) {
      callback(error, null);
    }
    args[0] = documents;
    _apply(collection, fn, args);
  });
};

// TODO: docs
COLLECTION.mapReduceCursor = function (collection, args, fn, callback) {
  args[args.length - 1] = function (error, collection) {
    collection.find(callback);
  };
  _apply(collection, 'mapReduce', args);
};

// TODO: docs
COLLECTION.mapReduceArray = function (collection, args, fn, callback) {
  COLLECTION.mapReduceCursor(collection, args, 'mapReduce', function (error, cursor) {
    if (error) {
      callback(error, null);
    } else {
      cursor.toArray(callback)
    }
  });
};

module.exports = COLLECTION;
