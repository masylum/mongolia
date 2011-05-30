/* updates a document client side
 * so you can have a representation of that document
 * after being updated */
var _ = require('underscore')

  , _strategy = function (op, ret) {
      switch (op) {
      case '$inc':
        return function (key, value) {
          ret[key] += value;
        };
      case '$set':
        return function (key, value) {
          ret[key] = value;
        };
      case '$unset':
        return function (key, value) {
          delete ret[key];
        };
      case '$push':
        return function (key, value) {
          if (ret[key]) {
            ret[key].push(value);
          } else {
            ret[key] = [value];
          }
        };
      case '$pushAll':
        return function (key, value) {
          if (ret[key]) {
            value.forEach(function (el) {
              ret[key].push(el);
            });
          } else {
            ret[key] = [value];
          }
        };
      case '$addToSet':
        return function (key, value) {
          if (ret[key]) {
            if (ret[key].indexOf(value) === -1) {
              ret[key].push(value);
            }
          } else {
            ret[key] = [value];
          }
        };
      case '$pop':
        return function (key, value) {
          if (value === 1) {
            ret[key].pop(value);
          } else {
            ret[key].shift(value);
          }
        };
      case '$pull':
        return function (key, value) {
          ret[key] = ret[key].filter(function (f) {
            return f !== value;
          });
        };
      case '$pullAll':
        return function (key, values) {
          ret[key] = ret[key].filter(function (f) {
            return values.indexOf(f) === -1;
          });
        };
      case '$rename':
        return function (old_field, new_field) {
          ret[new_field] = ret[old_field];
          delete ret[old_field];
        };
      }
    };

module.exports = function (VALIDATOR) {
  var keys = Object.keys(VALIDATOR.update)
    , special_op = keys[0][0] === '$'
    , ret = special_op ? _.clone(VALIDATOR.document) : _.clone(VALIDATOR.update)
    , op, key;


  if (special_op) {
    for (op in VALIDATOR.update) {
      if (VALIDATOR.update.hasOwnProperty(op)) {
        for (key in VALIDATOR.update[op]) {
          if (VALIDATOR.update[op].hasOwnProperty(key)) {
            _strategy(op, ret)(key, VALIDATOR.update[op][key]);
          }
        }
      }
    }
  }

  return ret;
};
