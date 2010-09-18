var Model = new require('class').Class({
  constructor: function(db, collection_name){
    this.db = db;
    this.collection_name = collection_name;
  },

  getCollection: function(callback) {
    this.db.collection(this.collection_name, function(error, collection) {
      if(error){
          callback(error);
      } else {
          callback(null, collection);
      }
    });
  },

  mongoCall: function() {
    var self = this,
        args = Array.prototype.slice.call(arguments, 0),
        funk = args.shift(),
        callback = args.last;

    this.getCollection(function(error, collection) {
      if(error){
          callback(error);
      } else {
        switch(funk) {
          case 'findArray':
            args.last = function(error, cursor){
                cursor.toArray(callback);
            };
            funk= 'find';
            break;
          case 'insert':
            if(Array.isArray(args[0])) {
                args[0].forEach(function(element){
                    self.onCreate(element);
                });
            } else {
                self.onCreate(args[0]);
            }

            args.last = function(error, docs){
              docs.forEach(function(element){
                self.afterCreate(element);
              });
              callback(error, docs);
            };
            break;
          case 'update':
          case 'findAndModify':
            self.onUpdate(args[1]);
            break;
          case 'mapReduceArray':
            args.last = function(error, collection) {
              collection.find(function(error, cursor) {
                if(error) {
                    callback(error);
                } else {
                  var results = [];
                  cursor.each(function(error, item) {
                    if(error) {
                        callback(error);
                    } else {
                      if(item) {
                          results.push(Object.merge(item._id, item.value));
                      } else {
                          callback(null, results);
                      }
                    }
                  });
                }
              });
            };
            funk= 'mapReduce';
            break;
          case 'mapReduceCursor':
            args.last= function(error, collection) {
              collection.find(callback);
            };
            funk= 'mapReduce';
            break;
        }
        collection[funk].apply(collection, args);
      }
    });
  },

  createInstance: function(element, callback) {
    var self= this;

    self.validate({}, element, function (errors, validator){
      if(!validator.hasErrors()) {
        self.onCreateInstance(element, function(errors, element){
          self.mongoCall('insert', element, function(errors, element){
            validator.updated_model = element[0];
            callback(null, validator);
          });
        });
      } else{
        callback(null, validator);
      }
    });
  },

  onCreate: function(element) {
    if(!element.created_at){
        element.created_at = new Date();
    }
  },

  afterCreate: function(element) {
    // to implement
  },

  onCreateInstance: function(element, callback) {
    // to implement
    callback(null, element);
  },

  updateInstance: function(model, update, callback) {
    var self= this;

    self.validate(model, update, function(errors, validator){
      if(!validator.hasErrors()) {
        self.onUpdateInstance(model, update, function(errors, update){
          self.mongoCall('update', {'_id': model._id}, {'$set': update}, { upsert: true, multi: false}, function(error, element){
            callback(null, validator);
          });
        });
      }else{
        callback(null, validator);
      }
    });
  },

  onUpdate: function(update) {
    if(!update.$set) {
        update.$set = {};
    }
    update.$set.updated_at = new Date();
  },

  onUpdateInstance: function(model, update, callback) {
    // to implement
    callback(null, update);
  },

  setEmbedObject: function(name, object){
    var result = {};
    this.skeletons[name].forEach(function(attr){
      result[attr] = object[attr];
    });
    return result;
  },

  updateEmbedObject: function(model, data, embed, options, callback) {
    var new_data = {},
        i = null,
        query = {};

    query[embed+'._id'] = model._id;

    for(i in data) {
      new_data[embed+'.'+i] = data[i];
    }

    this.mongoCall('update', query, {'$set': new_data}, options || {upsert: true, multi: true}, callback);
  },

  pushEmbedObject: function(model, data, embed, options, callback) {
    var new_data = {},
        i = null,
        query = {};

    query[embed+'._id'] = model._id;

    for(i in data) {
      new_data[embed+'.'+i] = data[i];
    }

    this.mongoCall('update', query, {'$push': new_data}, options || {upsert: true, multi: true}, callback);
  }
});

module.exports = Model;
