var NAMESPACER = {}
  , _ = require('underscore')
  , _getFields = function (visibility) {
      return visibility.reduce(function (memo, el) {
        memo[el] = 1;
        return memo;
      }, {});
    };

NAMESPACER.resolveNamespace = function (namespaces, namespace) {
  var ret = []
    , ns = namespaces[namespace]
    , attr;

  if (Array.isArray(ns)) {
    return ns;
  } else {
    if (ns.extend) {
      ret = namespaces[ns.extend];
    }

    if (ns.add) {
      ret = ret.concat(ns.add);
    }

    if (ns.remove) {
      ret = _.filter(ret, function (value) {
        return !_.include(ns.remove, value);
      });
    }
    return ret;
  }
};

NAMESPACER.addFieldFind = function (visibility, args) {
  var current_fields = args.length >= 3 ? args[1] : undefined
    , fields = _getFields(visibility)
    , tests = ['limit', 'sort', 'fields', 'skip', 'hint', 'explain', 'snapshot', 'timeout', 'tailable', 'batchSize']
    , is_option = args.length === 3 && tests.some(function (test) {
        return test in current_fields;
      });

  // selector, callback
  if (args.length < 3) {
    args.splice(1, 0, fields);
  } else if (args.length === 3 && is_option) {
    args.splice(1, 0, fields);
  // selector, fields, options, callback
  } else if (args.length >= 3) {
    args[1] = _.defaults(fields, args[1]);
  }
};

NAMESPACER.addFieldFindOne = function (visibility, args) {
  var fields = _getFields(visibility);

  // selector, callback
  if (args.length <= 2) {
    args.splice(1, 0, { fields: fields });
  // selector, fields, callback
  } else {
    args[1] = _.defaults({ fields: fields }, args[1]);
  }
};

NAMESPACER.addFieldFindAndModify = function (visibility, args) {
  var fields = _getFields(visibility);

  if (args.length === 2) {
    args.splice(1, 0, []);
  }

  if (args.length === 3) {
    args.splice(2, 0, null);
  }

  if (args.length === 4) {
    args.splice(3, 0, {});
  }

  args[3].fields = _.defaults(fields, args[3].fields);
};

NAMESPACER.filterUpdate = function (visibility, arg) {

  /* 0: not visible
   * 1: partial visible, needs more inspection
   * 2: fully visible
   */
  function isVisible(visibility, attr, level) {
    var ret = 0;

    visibility.some(function (el) {
      var match;
      if (attr.indexOf('.') !== -1) {
        match = attr.match(new RegExp(el + "(\..*)?"));
        if (match) {
          ret = 2;
        }
      } else {
        el = el.split('.');
        match = el[level] === attr;
        if (match) {
          ret = el.length === level + 1 ? 2 : 1;
        }
      }
      return match;
    });

    return ret;
  }

  function filter(el, level) {
    var attr, is_visible;

    for (attr in el) {
      if (el.hasOwnProperty(attr)) {
        // special op
        if (attr[0] === '$') {
          filter(el[attr], level);
        } else {
          is_visible = isVisible(visibility, attr, level);
          if (is_visible === 0) {
            delete el[attr];
          } else {
            if (is_visible === 1 && typeof el[attr] === 'object') {
              filter(el[attr], level + 1);
            }
          }
        }
      }
    }
  }

  if (!_.isEmpty(arg)) {
    if (Array.isArray(arg)) {
      arg.forEach(function (el) {
        filter(el, 0);
      });
    } else {
      filter(arg, 0);
    }
  }
};

NAMESPACER.filter = function (namespaces, namespace, fn, args) {
  var visibility = NAMESPACER.resolveNamespace(namespaces, namespace);

  if (fn === 'findAndModify') {
    NAMESPACER.addFieldFindAndModify(visibility, args);
    NAMESPACER.filterUpdate(visibility, args[2]);
  } else if (fn === 'findOne') {
    NAMESPACER.addFieldFindOne(visibility, args);
  } else if (fn.match(/^find/)) {
    NAMESPACER.addFieldFind(visibility, args);
  } else if (fn === 'insert') {
    NAMESPACER.filterUpdate(visibility, args[0]);
  } else if (fn === 'update') {
    NAMESPACER.filterUpdate(visibility, args[1]);
  }
};

module.exports = NAMESPACER;
