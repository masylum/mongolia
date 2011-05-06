    ooo        ooooo                                            oooo   o8o
    `88.       .888'                                            `888   `"'
     888b     d'888   .ooooo.  ooo. .oo.    .oooooooo  .ooooo.   888  oooo   .oooo.
     8 Y88. .P  888  d88' `88b `888P"Y88b  888' `88b  d88' `88b  888  `888  `P  )88b
     8  `888'   888  888   888  888   888  888   888  888   888  888   888   .oP"888
     8    Y     888  888   888  888   888  `88bod8P'  888   888  888   888  d8(  888
    o8o        o888o `Y8bod8P' o888o o888o `8oooooo.  `Y8bod8P' o888o o888o `Y888""8o
                                           d"     YD
                                           "Y88888P'


Flexible wrapper for the nodejs mongoDB driver.
Its not a ORM, but it can be used to handle the logic of your models.
No magic, no pain.

## Install

``` bash
$ npm install mongolia
```

Mongolia contains two independent modules:

  * `model`: An object representing a collection with some hooks of mongoDB calls.
  * `validator`: An object that validates mongoDB documents and returns errors if found.

# Model

Each model has a colection name and a reference to the database.

Models don't map data from mongoDB, they are just a layer to centralize all the logic.

``` javascript
module.exports = function (db) {
  // our user model will do mongoDB calls using 'users' collection
  var USER = require('mongolia').model(db, 'users');

  // implement some user logic

  return USER;
};
```

## mongoDB commands

Calls to the database are done using the function `mongo`.
Mongolia supports all the `collection` methods defiend on the driver plus some custom methods.

``` javascript
var Db = require('mongodb/lib/mongodb/db').Db,
    Server = require('mongodb/lib/mongodb/connection').Server,
    db = new Db('blog', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}));

db.open(function () {

    var User = require('./user.js')(db);
    User.mongo('findOne', {name: 'foo'}, function (error, user) {
      console.log(user);
    });

});
```

All the `collection` methods from the driver are supported.

If you need more information visit the [driver](http://github.com/christkv/node-mongodb-native) documentation

## Custom mongoDB commands

Mongolia provides some useful commands that are not available using the driver.

  * `findArray`: find that returns an array instead of a cursor.
  * `mapReduceArray`: mapReduce that returns an array with the results.
  * `mapReduceCursor`: mapReduce that returns a cursor.

## Hooks

Mongolia let you define some hooks on your models that will be triggered after a mongoDB command.

  * `onCreate(documents, callback)`:           triggered *before* an `insert`.
  * `afterCreate(documents, callback)`:        triggered *after* an `insert.
  * `onUpdate(document, update, callback)`:    triggered *before* an `update` or `findAndModify` command.
  * `afterUpdate(document, update, callback)`: triggered *after* an `update` or `findAndModify` command.
  * `onRemove(query, callback)`:               triggered *before* a `remove` command.
  * `afterRemove(query, callback)`:            triggered *after* a `remove` command.

Example:

``` javascript
module.exports = function (db) {
  var COMMENT = require('mongolia').model(db, 'comments');

  COMMENT.onCreate = function (documents, callback) {
    documents.forEach(function (doc) {
      doc.created_at = new Date();
    });
    callback(null, documents);
  };

  COMMENT.atferCreate = function (documents, callback) {
    var post = require('./post')(this.db);
    post.mongo('update', {_id: documents[0].post_id}, {'$inc': {num_posts: 1}}, callback);
  };

  return COMMENT;
};
```

## Embedded documents

Mongolia helps you to _denormalize_ your mongoDB database.

### getEmbeddedDocument

Filters document following the `skeletons` directive.

    getEmbeddedDocument(name, object, scope [, dot_notation]);

Example:

``` javascript
module.exports = function (db) {
  var POST = require('mongolia').model(db, 'posts');

  // only embed the comment's _id, and title
  POST.skeletons= {
    comment: ['_id', 'title']
  };

  return POST;
};

var comment = {'_id': 1, title: 'foo', body: 'Lorem ipsum'}
console.log(Post(db).getEmbeddedDocument('comment', comment));
// outputs => {'_id': 1, title: 'foo'};

console.log(Post(db).getEmbeddedDocument('comment', comment, 'post'));
// outputs => {post: {'_id': 1, title: 'foo'}};

console.log(Post(db).getEmbeddedDocument('comment', comment, 'post', true));
// outputs => {'post._id': 1, 'post.title': 'foo'};
```

### updateEmbeddedDocument

Updates an embed object.

``` javascript
updateEmbeddedDocument(query, document_name, document, options, callback);
```

Example:

``` javascript
module.exports = function (db) {
  var USER = require('mongolia').model(db, 'users');

  // After updating a user, we want to update denormalized Post.author foreach post
  USER.afterUpdate = function (query, update, callback) {
    Post(db).updateEmbeddedDocument({_id: query._id}, 'author', update, {}, callback);
  };

  return USER;
};
```

### pushEmbedObject

Pushes an embed object.

``` javascript
pushEmbedObject(query, data, name, options, callback);
```

Example:

``` javascript
module.exports = function (db) {
  var POST = require('mongolia')(db, 'posts');

  // After creating a post, we want to push it to `users.posts[]`
  POST.afterCreate = function (documents, callback) {
    User(db).pushEmbedObject({_id: documents[0].author._id}, 'posts', document);
  };

  return POST;
}
```

## Create and update using validations

Mongolia provides with two methods that allow you to create and update using the `validator`.

``` javascript
validateAndInsert(document, callback(error, validator));
validateAndUpdate(document, update, callback(error, validator));
```

In order to validate an insertion/update, the model have to implement a `validate` function on your model.

``` javascript
validate(document, update, callback);
```

Example:

``` javascript
// post.js
module.exports = function (db) {
  var POST = require('mongolia').model(db, 'posts');

  POST.validate = function (document, update, callback) {
    var validator = require('mongolia').validator(document, data);

    validator.validateRegex({
      title: [validator.regex.title, 'Incorrect title'],
      body: [/.{4,200}/, 'Incorrect body'],
    });

    if (!update.body === 'Lorem ipsum') {
      validator.addError('body', 'You can be a little bit more creative');
    }

    callback(null, validator);
  }

  return POST;
};

// app.js
var Post = require('./post.js');

Post(db).validateAndInsert(
  {title: 'This is a post', body: 'Lorem ipsum'},
  function (error, validator) {
    if (validator.hasErrors()) {
      console.log(validator.errors);
    } else {
      console.log(validator.updated_model);
    }
  }
);
```

# Validator

``` javascript
isUpdating()
```

Returns true if the validator is handling an updateInstance operation.

``` javascript
isInserting()
```

Returns true if the validator is handling an createInstance operation.

``` javascript
attrChanged(attr)
```

Returns true if the attributed changed

``` javascript
addError(field, value)
```

Adds an error to your validator. Accept dot notation to add nested errors.

``` javascript
hasError(field)
```

Returns true if the attributed failed a validation. Accept dot notation to check nested errors.

``` javascript
hasErrors()
```

Returns true if any attributed failed a validation

``` javascript
validateExistence(validations)
```

It fills your validator with errors if any of the elements are empty

``` javascript
validateRegex(validations)
```

It fills your validator with errors if any of the elements fail the regex

``` javascript
validateConfirmation(validations)
```

It fills your validator with errors if any of the elements fail the confirmation (good for passwords)

``` javascript
validateQuery(validations, callback)
```

It fills your validator with errors if any of the queries fail (good to avoid duplicated data)

Example using some of the validator features:

``` javascript
var User = function (db) {
  var USER = require('mongolia').model(db, 'users');

  USER.validate = function (element, data, callback) {
    var validator = require('mongolia').validator(element, data);

    validator.validateRegex({
      name: [validator.regex.username, 'Incorrect name'],
      email: [validator.regex.email, 'Incorrect email'],
      password: [validator.regex.password, 'Incorrect password'],
      description: [validator.regex.description, 'Incorrect description']
    });

    if (validator.attrChanged('password')) {
      validator.validateConfirmation({
        'password': ['password_confirmation', 'Passwords must match']
      });
    }

    if (!data.tags || data.tags.length <= 0) {
      validator.addError('tags', 'Select at least one tag');
    }

    if (validator.isUpdating()) {
      validator.validateQuery({
        name: [this, {name: data.name}, false, 'There is already a user with this name'],
        email: [this, {email: data.email}, false, 'There is already a user with this email']
      }, function () {
        callback(null, validator);
      });
    } else {
      callback(null, validator);
    }
  }

  return USER;
};
```
