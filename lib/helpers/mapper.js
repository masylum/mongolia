var MAPPER = {}
  , _ = require('underscore');

MAPPER.mapDocument = function (maps, arg) {

  /* 0: dont match
   * 1: partial matching, needs more inspection
   * 2: fully matching
   */
  function isMatching(maps, attr, level) {
    var ret = 0;

    Object.keys(maps).some(function (el) {
      var match;
      if (attr.indexOf('.') !== -1) {
        match = attr.match(new RegExp(el + "(\..*)?"));
        if (match) {
          ret = 2;
        }
      } else {
        match = el === attr;
        if (match) {
          ret = typeof maps[el] === 'object' ? 1 : 2;
        }
      }
      return match;
    });

    return ret;
  }

  function getObject(obj, attr) {
    // dot notation
    if (attr.indexOf('.') !== -1) {
      return attr.split('.').reduce(function (memo, part) {
        memo = memo[part];
        return memo;
      }, obj);
    } else {
      return obj[attr];
    }
  }

  function filter(maps, el, level) {
    var attr, is_matching;

    for (attr in el) {
      if (el.hasOwnProperty(attr)) {
        // special op
        if (attr[0] === '$') {
          filter(maps, el[attr], level);
        } else {
          is_matching = isMatching(maps, attr, level);
          if (is_matching === 2) {
            if (Array.isArray(el[attr])) {
              el[attr].forEach(function(value, i) {
                el[attr][i] = getObject(maps, attr)(el[attr][i]);
              });
            } else {
              el[attr] = getObject(maps, attr)(el[attr]);
            }
          } else {
            if (is_matching === 1 && typeof el[attr] === 'object') {
              filter(maps[attr], el[attr], level + 1);
            }
          }
        }
      }
    }
  }

  if (!_.isEmpty(arg)) {
    if (Array.isArray(arg)) {
      arg.forEach(function (el) {
        filter(maps, el, 0);
      });
    } else {
      filter(maps, arg, 0);
    }
  }
};

MAPPER.map = function (maps, fn, args) {
  if (fn === 'insert') {
    MAPPER.mapDocument(maps, args[0]);
  } else if (fn === 'update') {
    MAPPER.mapDocument(maps, args[1]);
  }
};

module.exports = MAPPER;
