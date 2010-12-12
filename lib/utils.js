/*
 * utils.js
 *
 * Shameless copy of ext.js by TJ Holowaychuk <tj@vision-media.ca>
 * Instead of extending Object,
 * we just attach this methods to a utils object
 *
 */

module.exports = (function () {
  return {
    /**
     * Check if an object is empty
     *
     * @param  {object} obj
     * @return {boolean}
     * @api public
     */
    isEmpty: function (obj) {
      if (obj === null || obj === undefined || obj === false) {
        return true;
      }
      return typeof obj === "object" && obj && Object.keys(obj).length === 0;
    },

    /**
     * Clones a object
     *
     * @param  {object} obj
     * @return {object}
     * @api public
     */
    clone: function (obj) {
      if (obj === null || typeof obj !== "object") {
        return obj;
      }

      if (obj.constructor !== Object && obj.constructor !== Array) {
        return obj;
      }

      if ([Date, RegExp, Function, String, Number, Boolean].indexOf(obj.constructor) !== -1) {
        return new obj.constructor(obj);
      }

      var to = new obj.constructor(),
          name = '';

      for (name in obj) {
        to[name] = typeof to[name] === "undefined" ? this.clone(obj[name], null) : to[name];
      }

      return to;
    },

    /**
     * Merges all values from object _b_ to _a_.
     *
     * @param  {object} a
     * @param  {object} b
     * @return {object}
     * @api public
     */

    merge: function (a, b) {
      if (!b) {
        return a;
      }
      var keys = Object.keys(b),
          i = 0,
          len = keys.length;

      for (; i < len; i += 1) {
        a[keys[i]] = b[keys[i]];
      }

      return a;
    },

    /**
     * Perform a deep merge with object _a_ and _b_.
     *
     * @param  {object} a
     * @param  {object} b
     * @return {object}
     * @api public
     */

    mergeDeep: function (a, b) {
      if (!b) {
        return a;
      }

      var target = a,
          keys = Object.keys(b),
          key = null,
          i = 0,
          len = keys.length;

      for (; i < len; i += 1) {
        key = keys[i];
        if (typeof b[key] === 'object') {
          target = this.mergeDeep((target[key] = target[key] || {}), b[key]);
        } else {
          target[key] = b[key];
        }
      }

      return a;
    },

    /**
     * Return object values as an array.
     *
     * @param  {object} object
     * @return {array}
     * @api public
     */
    values: function (obj) {
      if (!obj || typeof obj !== 'object') {
        return [];
      }
      var keys = Object.keys(obj),
          vals = [],
          i = 0,
          len = keys.length;

      for (; i < len; i += 1) {
        vals.push(obj[keys[i]]);
      }

      return vals;
    },

    /**
    * Returns the intersection of two arrays
    *
    * @param  {array} remove
    * @return {array}
    * @api public
    */
    intersect: function (a, b) {
      return a.filter(function (val) {
        return b.indexOf(val) !== -1;
      });
    }
  };
}());
