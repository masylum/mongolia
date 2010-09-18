var Validator = new require('class').Class({
  regex: {
    login: /^[A-Za-z](?=[A-Za-z0-9_.]{3,11}$)[a-zA-Z0-9_]*\.?[a-zA-Z0-9_]*$/,
    username: /^[A-Za-z0-9][A-Za-z0-9_@&$. \-]{3,31}[a-zA-Z0-9_]$/,
    title: /^[A-Za-z0-9].{3,50}/,
    description: /.{10,300}/,
    email: /^\S+@\S+\.\S+$/,
    password: /.{6,20}/
  },

  constructor: function (args) {
    this.model= args[0];
    this.data= args[1];
    this.updated_model= Object.merge(Object.clone(this.model), this.data);
    this.errors= {};
  },

  attrChanged: function (attr) {
    return this.model[attr] != this.data[attr];
  },

  hasError: function (field) {
    return this.hasErrors() && this.errors[field];
  },

  hasErrors: function () {
    return !Object.isEmpty(this.errors);
  },

  validateExistence: function (validations) {
    this.getKeys(validations).forEach(function (key, i) {
      if(!this.data[key]) {
        this.addError(key, validations[key]);
      }
    }, this);
  },

  validateRegex: function (validations) {
    this.getKeys(validations).forEach(function (key, i) {
      if(!this.data[key].match(validations[key][0])) {
        this.addError(key, validations[key][1]);
      }
    }, this);
  },

  validateConfirmation: function (validations) {
    this.getKeys(validations).forEach(function (key, i) {
      if(this.data[key] != this.data[validations[key][0]]) {
        this.addError(key, validations[key][1]);
        this.addError(validations[key][0], validations[key][1]);
      }
    }, this);
  },

  validateQuery: function (validations, callback) {
    var funk = $.funk(),
        self = this;

    this.getKeys(validations).forEach(function (key, i) {
      validations[key][0].mongoCall('findOne', validations[key][1], funk.add(function(errors, doc){
        if((validations[key][2] === true && !doc || validations[key][2] === false && doc)){
          self.addError(key, validations[key][3]);
        }
      }));
    });

    funk.parallel(callback);
  },

  addError: function (name, value) {
    if(!this.errors[name])
      this.errors[name]= [];

    this.errors[name].push(value);
  },

  getKeys: function (object) {
    return Object.keys(object).intersect(Object.keys(this.data));
  }
})

module.exports = Validator;
