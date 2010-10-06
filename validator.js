module.exports = function (args) {
  var validator = {},

  // private methods
  getKeys = function (object) {
    return Object.keys(object).intersect(Object.keys(validator.data));
  };

  validator.model = args[0];
  validator.data = args[1];
  validator.updated_model = Object.merge(Object.clone(this.model), this.data);
  validator.errors = {};

  validator.regex =  {
    login: /^[A-Za-z](?=[A-Za-z0-9_.]{3,11}$)[a-zA-Z0-9_]*\.?[a-zA-Z0-9_]*$/,
    username: /^[A-Za-z0-9][A-Za-z0-9_@&$. \-]{3,31}[a-zA-Z0-9_]$/,
    title: /^[A-Za-z0-9].{3,50}/,
    description: /.{10,300}/,
    email: /^\S+@\S+\.\S+$/,
    password: /.{6,20}/
  };

  validator.isUpdating = function () {
    return Object.isEmpty(this.model);
  };

  validator.isInserting = function () {
    return !Object.isEmpty(this.model);
  };

  validator.attrChanged = function (attr) {
    return this.model[attr] !== this.data[attr];
  };

  validator.hasError = function (field) {
    return this.hasErrors() && this.errors[field];
  };

  validator.hasErrors = function () {
    return !Object.isEmpty(this.errors);
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
          this.addError(key, validations[key][3]);
        }
      }));
    });

    funk.parallel(callback);
  };

  validator.addError = function (name, value) {
    if (!this.errors[name]) {
      this.errors[name] = [];
    }

    this.errors[name].push(value);
  };

  return validator;
}
