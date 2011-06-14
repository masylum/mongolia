/* updates a document client side
 * so you can have a representation of that document
 * after being updated */
var _ = require('underscore');

/* parses the object
 * using dot notation if specified
 *
 * @param {Object} ret
 * @param {String} key
 *
 * @return {Object}
 */
function _parseRet(ret, key) {
  var parts = key.split('.');

  // dot notation
  if (parts.length > 1) {
    return _parseRet(ret[parts[0]], parts.slice(1).join('.'));
  } else {
    return ret;
  }
}

/* parses the key
 * using dot notation if specified
 *
 * @param {Object} ret
 * @param {String} key
 *
 * @return {Object}
 */
function _parseKey(key) {
  var parts = key.split('.');

  // dot notation
  if (parts.length > 1) {
    return parts.slice(-1)[0];
  } else {
    return key;
  }
}

function _strategy(op, ret, key, value) {
  ret = _parseRet(ret, key);
  key = _parseKey(key);

  switch (op) {
  case '$inc':
    ret[key] += value;
    break;
  case '$set':
    ret[key] = value;
    break;
  case '$unset':
    delete ret[key];
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
      ret[key] = [value];
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
    if (value === 1) {
      ret[key].pop(value);
    } else {
      ret[key].shift(value);
    }
    break;
  case '$pull':
    ret[key] = ret[key].filter(function (f) {
      return f !== value;
    });
    break;
  case '$pullAll':
    ret[key] = ret[key].filter(function (f) {
      return value.indexOf(f) === -1;
    });
    break;
  case '$rename':
    ret[value] = ret[key];
    delete ret[key];
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
