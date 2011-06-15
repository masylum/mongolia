var UTILS = {};

/* explores an object given an attribute
 * or a `dot_notation` attribute
 *
 * @param {Object} obj
 * @param {String} attr
 * @param {Boolean} create
 *
 * @return {Array} [obj, attr]
 */
UTILS.inspect = function (obj, attr, create) {
  var attr_parts = attr.split('.')
    , last, current;

  if (attr_parts.length === 1) {
    return [obj, attr];
  } else {
    last = obj;
    for (;attr_parts.length > 0;) {
      current = attr_parts.shift();

      if (!last) {
        return [undefined, current];
      }

      if (create && !last[current]) {
        last[current] = attr_parts.length ? {} : undefined;
      }

      if (!attr_parts.length) {
        return [last, current];
      }

      last = last[current];
    }
  }
};

//exports
module.exports = UTILS;
