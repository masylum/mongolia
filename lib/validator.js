module.exports = function (document, update) {
  var VALIDATOR = {},
      _ = require('underscore'),
      utils = require('./utils'),
      UpdateDocument = require('./helpers/update_document');

  // private methods
  function _getKeys(object) {
    return _.intersect(Object.keys(object), Object.keys(VALIDATOR.updated_document));
  }

  if (!document) {
    throw Error("Must provide a document");
  }

  if (!update) {
    throw Error("Must provide an update object");
  }

  VALIDATOR.document = document || {};
  VALIDATOR.update = update || {};
  VALIDATOR.updated_document = UpdateDocument(VALIDATOR);
  VALIDATOR.errors = {};

  VALIDATOR.regex =  {
    login: /^[A-Za-z](?=[A-Za-z0-9_.]{3,11}$)[a-zA-Z0-9_]*\.?[a-zA-Z0-9_]*$/,
    username: /^[A-Za-z0-9][A-Za-z0-9_@&$. \-]{3,31}[a-zA-Z0-9_]$/,
    title: /^[A-Za-z0-9].{3,50}/,
    description: /.{10,300}/,
    email: /^\S+@\S+\.\S+$/,
    password: /.{6,20}/,
    url: /((http|https|ftp):\/\/(\S*?\.\S*?))(\s|\;|\)|\]|\[|\{|\}|,|\"|'|:|\<|$|\.\s)/i
  };

  /* is the model being updated?
   *
   * @return {Boolean}
   */
  VALIDATOR.isUpdating = function () {
    return !_.isEmpty(this.document);
  };

  /* is the model being inserted?
   *
   * @return {Boolean}
   */
  VALIDATOR.isInserting = function () {
    return _.isEmpty(this.document);
  };

  /* did the attribute change?
   *
   * @param {String}
   * @return {Boolean}
   */
  VALIDATOR.attrChanged = function (attr) {
    return this.document[attr] !== this.updated_document[attr];
  };

  /* gets or creates an error bucket fot the given attribute
   *
   * @param {String} attr
   * @param {Boolean} create
   *
   * @return {Object}
   */
  VALIDATOR.getErrorBucket = function (attr, create) {
    var attr_parts = attr.split('.')
      , error_bucket, key;

    if (attr_parts.length === 1) {
      if (create && !this.errors[attr]) {
        this.errors[attr] = [];
      }
      return this.errors[attr] || null;
    } else {
      error_bucket = this.errors;
      for (;attr_parts.length > 0;) {
        key = attr_parts.shift();

        if (!error_bucket[key]) {
          if (create) {
            error_bucket[key] = attr_parts.length === 0 ? [] : {};
          } else {
            return null;
          }
        }
        error_bucket = error_bucket[key];
      }
    }
    return error_bucket;
  };

  /* does attr have any error?
   *
   * @param {String}
   * @return {Boolean}
   */
  VALIDATOR.hasError = function (attr) {
    return this.hasErrors() && this.getErrorBucket(attr) !== null;
  };

  /* does the model have any error?
   *
   * @return {Boolean}
   */
  VALIDATOR.hasErrors = function () {
    return !_.isEmpty(this.errors);
  };

  /* validates existence of some attributes
   *
   * {attr1: 'error message', attr2: ...}
   *
   * @param {Object} validations
   * @return self
   */
  VALIDATOR.validateExistence = function (validations) {
    Object.keys(validations).forEach(function (key, i) {
      var parsed = utils.inspect(this.updated_document, key)
        , obj = parsed[0]
        , attr = parsed[1];

      if (!obj[attr]) {
        this.addError(key, validations[key]);
      }
    }, this);
    return VALIDATOR;
  };

  /* validates regex matching of some attributes
   *
   * {attr1: [/regex/, 'error message'], attr2: ...}
   *
   * @param {Object} validations
   * @return self
   */
  VALIDATOR.validateRegex = function (validations) {
    Object.keys(validations).forEach(function (key, i) {
      var parsed = utils.inspect(this.updated_document, key)
        , obj = parsed[0]
        , attr = parsed[1];

      if (!obj[attr] || !validations[key][0].test(obj[attr])) {
        this.addError(key, validations[key][1]);
      }
    }, this);
    return VALIDATOR;
  };

  /* validates confirmation of some attributes
   *
   * {attr1: ['confirmation_key', 'error message'], attr2: ...}
   *
   * @param {Object} validations
   * @return self
   */
  VALIDATOR.validateConfirmation = function (validations) {
    Object.keys(validations).forEach(function (key, i) {
      var parsed = utils.inspect(this.updated_document, key)
        , obj = parsed[0], attr = parsed[1]
        , parsed2 = utils.inspect(this.updated_document, validations[key][0])
        , obj2 = parsed2[0], attr2 = parsed2[1];

      if (!obj[attr] || !obj2[attr2] || obj[attr] !== obj2[attr2]) {
        this.addError(key, validations[key][1]);
        this.addError(validations[key][0], validations[key][1]);
      }
    }, this);
    return VALIDATOR;
  };

  /* validates that a query returns something or nothing
   *
   * {attr1: [Model, query, true|false, 'error message'], attr2: ...}
   *
   * @param {Object} validations
   * @param {Function} callback
   * @return self
   */
  VALIDATOR.validateQuery = function (validations, callback) {
    var funk = require('funk')();

    _getKeys(validations).forEach(function (key, i) {
      validations[key][0].mongo('findOne', validations[key][1], funk.add(function (errors, doc) {
        if ((validations[key][2] === true && !doc || validations[key][2] === false && doc)) {
          VALIDATOR.addError(key, validations[key][3]);
        }
      }));
    });

    funk.parallel(callback);
    return VALIDATOR;
  };

  /* adds an error to the error bucket
   *
   * @param {String} name
   * @param {*} value
   * @return self
   */
  VALIDATOR.addError = function (name, value) {
    var error_bucket = this.getErrorBucket(name, true);

    error_bucket.push(value);
    return VALIDATOR;
  };

  return VALIDATOR;
};
