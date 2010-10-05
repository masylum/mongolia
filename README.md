# Mongolia

  Lightweight, fast, flexible models using MongoDB.

  Mongolia contains two modules:
  * Model: An object representing a collection with some wrappers/hooks of MongoDB calls.
  * Validator: An object that validates MongoDB documents and returns errors if found.

## Dependencies

    $ npm install class

# Model

Each model has a colection name and a reference to the database.

    var User = require('model').extend({
      constructor: function (db) {
        Model.call(this, db, 'users');
      }
    });

Calls to the database are done using the function mongoCall.

...
findArray
insert
update
findAndModify
mapReduceArray
mapReduceCursor

# Validator
