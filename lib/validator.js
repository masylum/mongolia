module.exports = function (model, data) {
  var validator = {},
      utils = require('./utils'),

  // private methods
  getKeys = function (object) {
    return utils.intersect(Object.keys(object), Object.keys(validator.data));
  };

  validator.model = model || {};
  validator.data = data || {};
  validator.updated_model = utils.merge(utils.clone(validator.model), validator.data);
  validator.errors = {};

  validator.regex =  {
    login: /^[A-Za-z](?=[A-Za-z0-9_.]{3,11}$)[a-zA-Z0-9_]*\.?[a-zA-Z0-9_]*$/,
    username: /^[A-Za-z0-9][A-Za-z0-9_@&$. \-]{3,31}[a-zA-Z0-9_]$/,
    title: /^[A-Za-z0-9].{3,50}/,
    description: /.{10,300}/,
    email: /^\S+@\S+\.\S+$/,
    password: /.{6,20}/,
    url: /((http|https|ftp):\/\/(\S*?\.\S*?))(\s|\;|\)|\]|\[|\{|\}|,|\"|'|:|\<|$|\.\s)/i
  };

  validator.isUpdating = function () {
    return utils.isEmpty(this.model);
  };

  validator.isInserting = function () {
    return !utils.isEmpty(this.model);
  };

  validator.attrChanged = function (attr) {
    return this.model[attr] !== this.data[attr];
  };

  validator.getErrorBucket = function (name, create) {
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

  validator.hasError = function (name) {
    return this.hasErrors() && this.getErrorBucket(name, false) !== null;
  };

  validator.hasErrors = function () {
    return !utils.isEmpty(this.errors);
  };

  validator.validateExistence = function (validations) {
    getKeys(validations).forEach(function (key, i) {
      if (!this.data[key]) {
        this.addError(key, validations[key]);
      }
    }, this);
  };

  validator.validateRegex = function (validations) {
    getKeys(validations).forEach(function (key, i) {
      if (!this.data[key].match(validations[key][0])) {
        this.addError(key, validations[key][1]);
      }
    }, this);
  };

  validator.validateConfirmation = function (validations) {
    getKeys(validations).forEach(function (key, i) {
      if (this.data[key] !== this.data[validations[key][0]]) {
        this.addError(key, validations[key][1]);
        this.addError(validations[key][0], validations[key][1]);
      }
    }, this);
  };

  validator.validateQuery = function (validations, callback) {
    var funk = $.funk();

    getKeys(validations).forEach(function (key, i) {
      validations[key][0].mongoCall('findOne', validations[key][1], funk.add(function (errors, doc) {
        if ((validations[key][2] === true && !doc || validations[key][2] === false && doc)) {
          validator.addError(key, validations[key][3]);
        }
      }));
    });

    funk.parallel(callback);
  };

  validator.addError = function (name, value) {
    var error_bucket = this.getErrorBucket(name, true);
    error_bucket.push(value);
  };

  return validator;
};
