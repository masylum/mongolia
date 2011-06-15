/* updates a document client side
 * so you can have a representation of that document
 * after being updated */
var _ = require('underscore')
  , utils = require('../utils');

function _strategy(op, ret, key, value) {
  var is_destructive = ['$unset', '$pop', '$pull', '$pullAll', '$rename'].indexOf(op) !== -1
    , parsed = utils.inspect(ret, key, !is_destructive);

  ret = parsed[0];
  key = parsed[1];

  switch (op) {
  case '$inc':
    ret[key] = ret[key] ? ret[key] + value : value;
    break;
  case '$set':
    ret[key] = value;
    break;
  case '$unset':
    if (typeof ret !== 'undefined') {
      delete ret[key];
    }
    break;
  case '$push':
    if (ret[key]) {
      ret[key].push(value);
    } else {
      ret[key] = [value];
    }
    break;
  case '$pushAll':
    if (ret[key]) {
      value.forEach(function (el) {
        ret[key].push(el);
      });
    } else {
      ret[key] = value;
    }
    break;
  case '$addToSet':
    if (ret[key]) {
      if (ret[key].indexOf(value) === -1) {
        ret[key].push(value);
      }
    } else {
      ret[key] = [value];
    }
    break;
  case '$pop':
    if (typeof ret !== 'undefined') {
      if (value === 1) {
        ret[key].pop(value);
      } else {
        ret[key].shift(value);
      }
    }
    break;
  case '$pull':
    if (typeof ret !== 'undefined') {
      ret[key] = ret[key].filter(function (f) {
        return f !== value;
      });
    }
    break;
  case '$pullAll':
    if (typeof ret !== 'undefined') {
      ret[key] = ret[key].filter(function (f) {
        return value.indexOf(f) === -1;
      });
    }
    break;
  case '$rename':
    if (typeof ret !== 'undefined') {
      ret[value] = ret[key];
      delete ret[key];
    }
    break;
  }
}

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
            _strategy(op, ret, key, VALIDATOR.update[op][key]);
          }
        }
      }
    }
  }

  return ret;
};
