if (global.GENTLY) {
  require = global.GENTLY.hijack(require);
}

var _ = require('underscore');

module.exports = function (db, collection_name) {

  if (!db) {
    throw (Error('You must specify a db'));
  }

  if (!collection_name) {
    throw (Error('You must specify a collection name'));
  }

  var MODEL = {
    db: db
  , collection_proxy: require('./helpers/collection_proxy')
  };

  /**
   * Gets the mongo collection
   *
   * @param {Function} callback
   * @returns itself
   */
  MODEL.getCollection = function (callback) {
    db.collection(collection_name, callback);

    return MODEL;
  };

  /**
   * Proxies `collection` calls and then:
   *
   *  + Namespacing: Filters sent and received documents according to namespaces.
   *  + Mapping: Applies functions to sent and received document attributes.
   *  + Hooks: Calls some before* and after* hooks
   *
   * This functionalities are enabled by default, but you can disable them by providing
   * options as the first param.
   *
   * Adds custom `findArray`, `mapReduceCursor` and `mapReduceArray`.
   *
   * @param {String|Object} options
   * @param {Mixed} args
   * @param {Function} callback
   * @returns itself
   */
  MODEL.mongo = function (args) {
    var parsed_method, options, callback;

    args = [].slice.call(arguments, 0);
    options = args.shift();

    if (typeof options === 'string') {
      parsed_method = options.match(/([a-zA-Z]*)(?::([a-zA-Z]*))?/); // extract the namespace
      options = {
        method: parsed_method[1]
      , namespace: parsed_method[2]
      };
    }

    if (!options.method) {
      throw (Error('`method` is mandatory!'));
    }

    options = _.extend({
      hooks: true
    , namespacing: true
    , mapping: true
    }, options);

    if (typeof args[args.length - 1] === 'function') {
      callback =  args[args.length - 1];
    } else {
      callback =  function () {}; // noop
      args.push(callback);
    }

    MODEL.collection_proxy.proxy(MODEL, options, args, callback);

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
   * @param {Object} options
   * @param {Function} callback
   * @returns itself
   */
  MODEL.validateAndInsert = function (document, options, callback) {
    // options are optional
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    var fn = {method: 'insert', namespacing: false, mapping: false}
      , args = [document];

    if (options.namespace) {
      fn.namespace = options.namespace;
    }

    if (MODEL.namespaces && MODEL.namespaces[options.namespace]) {
      // has side effects, alters args
      MODEL.collection_proxy.namespacer.filter(MODEL.namespaces, options.namespace, 'insert', args);
    }

    if (MODEL.maps) {
      // has side effects, alters args
      MODEL.collection_proxy.mapper.map(MODEL.maps, 'insert', args);
    }

    MODEL.validate({}, document, function (error, validator) {
      if (error) return callback(error);
      if (validator.hasErrors()) return callback(null, validator);

      args.push(function cb(error, documents) {
        if (error) {
          return callback(error);
        } else {
          if (documents) {
            validator.updated_document = documents[0];
          }
          callback(error, validator);
        }
      });
      args.unshift(fn);
      MODEL.mongo.apply(MODEL, args);
    });

    return MODEL;
  };

  /**
   * Hook triggered before inserting a document
   *
   * @param {Array} documents
   * @param {Function} callback
   */
  MODEL.beforeInsert = function (documents, callback) {
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
  MODEL.afterInsert = function (documents, callback) {
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
    update.$set = update.$set || {};
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
   * @param {Object} query      - Document query
   * @param {Object} update     - Update object
   * @param {Object} options    - Update options. Defaults to {upsert: false, multi: false}
   * @param {Function} callback - The callback returns a validator
   *
   * @returns itself
   */
  MODEL.validateAndUpdate = function (query, update, options, callback) {
    // options are optional
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    options = _.defaults(options, {upsert: false, multi: false});

    var fn = {method: 'update', namespacing: false, mapping: false}
      , args = [query, update, options];

    if (options.namespace) {
      fn.namespace = options.namespace;
    }
    delete options.namespace;

    if (MODEL.namespaces && MODEL.namespaces[options.namespace]) {
      // has side effects, alters args
      MODEL.collection_proxy.namespacer.filter(MODEL.namespaces, options.namespace, 'update', args);
    }

    if (MODEL.maps) {
      // has side effects, alters args
      MODEL.collection_proxy.mapper.map(MODEL.maps, 'update', args);
    }

    MODEL.mongo('findOne', query, function (error, document) {
      if (error) return callback(error);

      MODEL.validate(document, update, function (error, validator) {
        if (error) return callback(error);

        if (validator.hasErrors()) {
          return  callback(null, validator);
        } else {
          args.push(function cb(error, _) {
            callback(error, validator);
          });
          args.unshift(fn);
          args[1] = {_id: document._id};
          MODEL.mongo.apply(MODEL, args);
        }
      });
    });

    return MODEL;
  };

  /**
   * Get the document ready to embed to this model according to the skeleton
   * TODO: Refactor this method! Or take it away as a helper
   *
   * @param {String} name
   * @param {Object} document
   * @param {String} scope         - Optional field to scope the resulting document
   * @param {Boolean} dot_notation - Return the nested object or using dot_notation ready for mongo
   *
   * @returns document with applied skeleton
   */
  MODEL.getEmbeddedDocument = function (name, document, scope, dot_notation) {
    var filtered = _.clone(document)
      , result = {}
      , pointer = result;


    function parseAttr(scope, attr) {
      return dot_notation ? ((scope ? scope + '.' : '') + attr) : attr;
    }
    /* 0: not visible
     * 1: partial visible, needs more inspection
     * 2: fully visible
     */
    function isVisible(attr, level) {
      var ret = 0;

      if (MODEL.skeletons && MODEL.skeletons[name]) {
        _.some(MODEL.skeletons[name], function (el) {
          var match;
          if (attr.indexOf('.') !== -1) {
            match = attr.match(new RegExp(el + "(\..*)?"));
            if (match) {
              ret = 2;
            }
          } else {
            el = el.split('.');
            match = el[level] === attr;
            if (match) {
              ret = el.length === level + 1 ? 2 : 1;
            }
          }
          return match;
        });
      } else {
        return 2; // if no skeleton available, everything is visible!
      }

      return ret;
    }

    function filter(el, level, accumulated_scope) {
      var attr, is_visible;

      for (attr in el) {
        if (el.hasOwnProperty(attr)) {
          is_visible = isVisible(attr, level);
          if (is_visible === 0) {
            delete el[attr];
          } else {

            if (is_visible === 1 && typeof el[attr] === 'object') {
              filter(el[attr], level + 1, accumulated_scope ? accumulated_scope + '.' + attr : attr);
              if (dot_notation) {
                delete el[attr];
              }
            } else {
              if (dot_notation && parseAttr(attr) !== attr) {
                if (accumulated_scope) {
                  filtered[parseAttr(parseAttr(scope, accumulated_scope), attr)] = el[attr];
                } else {
                  el[parseAttr(scope, attr)] = el[attr];
                }
                delete el[attr];
              }
            }
          }
        }
      }
    }

    filter(filtered, 0);

    if (scope && !dot_notation) {
      scope.split('.').forEach(function (level, i, array) {
        pointer = pointer[level] = (i === array.length - 1) ? filtered : {};
      });
      return result;
    } else {
      return filtered;
    }
  };

  /**
   * Update all the embedded objects
   *
   * @param {ObjectID} id          - Id of the embedded document to be updated
   * @param {String} document_name - Name for the embedded document
   * @param {Object} document      - Document to be embedded
   * @param {Object} options       - Update options. Defaults to {upsert: false, multi: true}
   * @param {Function} callback
   *
   * @returns itself
   */
  MODEL.updateEmbeddedDocument = function (query, document_name, document, options, callback) {
    var update = {},
        scoped_query = {};

    document = document.$set || document;

    update = MODEL.getEmbeddedDocument(document_name, document, document_name, true);

    // options are optional
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    options = _.extend({upsert: false, multi: true}, options);
    Object.keys(query).forEach(function (attr) {
      scoped_query[document_name + '.' + attr] = query[attr];
    });

    MODEL.mongo({method: 'update', hooks: false}, scoped_query, {'$set': update}, options, callback);

    return MODEL;
  };

  /**
   * Push an embedded document.
   *
   * @param {Object} query          - Query to match the objects to push the embedded doc
   * @param {String} document_name  - Name for the embedded document array
   * @param {Object} document       - Document to be push
   * @param {Object} options        - Update options. Defaults to {upsert: false, multi: true}
   * @param {Function} callback
   *
   * @returns itself
   */
  MODEL.pushEmbeddedDocument = function (query, document_name, document, options, callback) {
    var update = {};

    update[document_name] = MODEL.getEmbeddedDocument(document_name, document);

    // options are optional
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else {
      options = options || {};
    }

    options = _.extend({upsert: false, multi: true}, options);
    MODEL.mongo({method: 'update', hooks: false}, query, {'$push': update}, options, callback);

    return MODEL;
  };

  return MODEL;
};
