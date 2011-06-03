var MAPPER = {}
  , _ = require('underscore');

MAPPER.filterUpdate = function (types, arg) {

  function filter(types, el) {
    var attr;

    for (attr in el) {
      if (el.hasOwnProperty(attr)) {
        // special op
        if (attr[0] === '$') {
          filter(types, el[attr]);
        } else {
          if (typeof types[attr] === 'function') {
            el[attr] = types[attr](el[attr]);
          } else {
            if (typeof el[attr] === 'object') {
              filter(types[attr], el[attr]);
            }
          }
        }
      }
    }
  }

  if (!_.isEmpty(arg)) {
    if (Array.isArray(arg)) {
      arg.forEach(function (el) {
        filter(types, el);
      });
    } else {
      filter(types, arg);
    }
  }
};

MAPPER.map = function (types, fn, args) {
  if (fn === 'insert') {
    MAPPER.filterUpdate(types, args[0]);
  } else if (fn === 'update') {
    MAPPER.filterUpdate(types, args[1]);
  }
};

module.exports = MAPPER;
