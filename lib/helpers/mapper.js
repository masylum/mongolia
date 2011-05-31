var MAPPER = {}
  , _ = require('underscore');

MAPPER.filterUpdate = function (types, arg) {
  var filter = function (el) {
        var attr, sub_attr;
        for (attr in el) {

          // special op
          if (attr[0] === '$') {
            for (sub_attr in el[attr]) {
              if (typeof types[sub_attr] === 'function') {
                el[attr][sub_attr] = types[sub_attr](el[attr][sub_attr]);
              }
            }
          } else {
            if (typeof types[attr] === 'function') {
              el[attr] = types[attr](el[attr]);
            }
          }
        }
      };

  if (!_.isEmpty(arg)) {
    if (Array.isArray(arg)) {
      arg.forEach(filter);
    } else {
      filter(arg);
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
