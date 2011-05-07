module.exports = function (document, update) {
  var VALIDATOR = {},
      utils = require('./utils'),

      // private methods
      getKeys = function (object) {
        return utils.intersect(Object.keys(object), Object.keys(VALIDATOR.update));
      };

  if (!document) {
    throw Error("Must provide a document");
  }

  if (!update) {
    throw Error("Must provide an update object");
  }

  VALIDATOR.document = document || {};
  VALIDATOR.update = update || {};
  VALIDATOR.updated_document = utils.merge(utils.clone(VALIDATOR.document), VALIDATOR.update);
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

  VALIDATOR.isUpdating = function () {
    return !utils.isEmpty(this.document);
  };

  VALIDATOR.isInserting = function () {
    return utils.isEmpty(this.document);
  };

  VALIDATOR.attrChanged = function (attr) {
    return this.document[attr] !== this.update[attr];
  };

  VALIDATOR.getErrorBucket = function (name, create) {
    var error_bucket = {},
        key = null,
        name_parts = name.split('.');

    if (name_parts.length === 1) {
      if (create) {
        this.errors[name] = this.errors[name] || [];
      }
      return this.errors[name] ? this.errors[name] : null;
    } else {
      error_bucket = this.errors;
      for (;name_parts.length > 0;) {
        key = name_parts.shift();
        if (!error_bucket[key]) {
          if (create) {
            error_bucket[key] = name_parts.length === 0 ? [] : {};
          } else {
            return null;
          }
        }
        error_bucket = error_bucket[key];
      }
    }
    return error_bucket;
  };

  VALIDATOR.hasError = function (name) {
    return this.hasErrors() && this.getErrorBucket(name, false) !== null;
  };

  VALIDATOR.hasErrors = function () {
    return !utils.isEmpty(this.errors);
  };

  VALIDATOR.validateExistence = function (validations) {
    getKeys(validations).forEach(function (key, i) {
      if (!this.update[key]) {
        this.addError(key, validations[key]);
      }
    }, this);
  };

  VALIDATOR.validateRegex = function (validations) {
    getKeys(validations).forEach(function (key, i) {
      if (!this.update[key] || !this.update[key].match(validations[key][0])) {
        this.addError(key, validations[key][1]);
      }
    }, this);
  };

  VALIDATOR.validateConfirmation = function (validations) {
    getKeys(validations).forEach(function (key, i) {
      if (this.update[key] !== this.update[validations[key][0]]) {
        this.addError(key, validations[key][1]);
        this.addError(validations[key][0], validations[key][1]);
      }
    }, this);
  };

  VALIDATOR.validateQuery = function (validations, callback) {
    var funk = require('funk')();

    getKeys(validations).forEach(function (key, i) {
      validations[key][0].mongo('findOne', validations[key][1], funk.add(function (errors, doc) {
        if ((validations[key][2] === true && !doc || validations[key][2] === false && doc)) {
          VALIDATOR.addError(key, validations[key][3]);
        }
      }));
    });

    funk.parallel(callback);
  };

  VALIDATOR.addError = function (name, value) {
    var error_bucket = this.getErrorBucket(name, true);
    error_bucket.push(value);
  };

  return VALIDATOR;
};
