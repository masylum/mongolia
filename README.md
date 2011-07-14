    ooo        ooooo                                            oooo   o8o
    `88.       .888'                                            `888   `"'
     888b     d'888   .ooooo.  ooo. .oo.    .oooooooo  .ooooo.   888  oooo   .oooo.
     8 Y88. .P  888  d88' `88b `888P"Y88b  888' `88b  d88' `88b  888  `888  `P  )88b
     8  `888'   888  888   888  888   888  888   888  888   888  888   888   .oP"888
     8    Y     888  888   888  888   888  `88bod8P'  888   888  888   888  d8(  888
    o8o        o888o `Y8bod8P' o888o o888o `8oooooo.  `Y8bod8P' o888o o888o `Y888""8o
                                           d"     YD
                                           "Y88888P'


Mongolia is a layer that sits on top of the mongo driver and helps you dealing with your data logic.
Mongolia is not an ORM. Models contains no state, just logic.
Mongolia contains no magic.

## Install

``` bash
npm install mongolia
```

Mongolia contains two independent modules:

  * `model`: An object representing a collection with some hooks of mongo calls.
  * `validator`: An object that validates mongoDB documents and returns errors if found.

# Model

Models are attached to collections.
Models don't map data from the db, they just define the logic.

``` javascript
var USER = require('mongolia').model(db, 'users');
```

## mongo proxied collection commands

Calls to the db are done using the method `mongo`.
`mongo` proxies all the `collection` methods defined on the driver plus some custom methods.

This allows mongolia to extend the driver with extra functionalties:

  * Namespacing: Allows you to filter the documents going and coming from the db.
  * Mapping: Allows you to apply functions to the documents attributes going and coming from the db.
  * Hooks: They are triggered before and after a call is done.

The default usage is:

`mongo('method[:namespace]', args)`

If you want to disable any functionality you can by doing:

`mongo({method: method[, namespace: namespace, namespacing: false, mapping: false, hooks: false])`

Example:
``` javascript
var Db = require('mongodb/lib/mongodb/db').Db,
    Server = require('mongodb/lib/mongodb/connection').Server,
    db = new Db('blog', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}));

db.open(function () {
  var User = require('./user.js')(db);

  User.mongo('findOne', {name: 'foo'}, console.log);
  User.mongo({method: 'insert', hooks: false}, {name: 'foo'}, console.log);
});
```

All the `collection` methods from the driver are supported.

If you need more information visit the [driver](http://github.com/christkv/node-mongodb-native) documentation

### Custom mongo collection commands

Mongolia provides some useful commands that are not available using the driver.

  * `findArray`: find that returns an array instead of a cursor.
  * `mapReduceArray`: mapReduce that returns an array with the results.
  * `mapReduceCursor`: mapReduce that returns a cursor.

### Namespacing

Secure your data access defining visibility namespaces.

You can namespace a call to the database by appending `:namespace` on
your proxied method.

If called without a namespace, the method will work ignoring the `namespace` directives.

You can `extend` other namespaces and `add` or `remove` some data visibility.

``` javascript
var USER = require('mongolia').model(db, 'users');

USER.namespaces = {
  public: ['account.email', 'account.name', '_id'],
  private: {
    extend: 'public',
    add: ['password'],
  },
  accounting: {
    extend: 'private',
    add: ['credit_card_number'] // don't do this at home
  }
};

USER.mongo('insert:public', {account: {email: 'foo@bar.com'}, password: 'fleiba', credit_card_number: 123, is_active: true});
// insert => {account: {email: 'foo@bar.com'}}

USER.validateAndUpdate({account: {email: 'foo@bar.com'}}, {'$set': {'account.email': 'super@mail.com', password: '123'}, {namespace: 'public'});
// updates => {'$set': {'account.email': 'super@mail.com'}}

USER.mongo('findArray:public', {account: {email: 'foo@bar.com'}});
// find => {account: {email: 'foo@bar.com', name: 'paco'}}

USER.mongo('findArray:accounting', {account: {email: 'foo@bar.com'}});
// find => {account: {email: 'foo@bar.com', name: 'paco'}, password: 'fleiba', credit_card_number: 123}
```

Use this feature wisely to filter data coming from forms.

### Mappings and type casting

Mongolia `maps` allows you to cast the data before is stored to the database.
Mongolia will apply the specified function for each attribute on the `maps` object.

By default we provide the map `_id -> ObjectId`, so you don't need to cast it.

``` javascript
var USER = require('mongolia').model(db, 'users');

USER.maps = {
  _id: ObjectID,
  account: {
    email: String,
    name: function (val) {val.toUpperCase()}
  },
  password: String,
  salt: String,
  is_deleted: Boolean
};

USER.mongo('insert', {email: 'foo@bar.com', password: 123, name: 'john', is_deleted: 'true'});
// stored => {password: '123', name: 'JOHN', is_deleted: true}
```

### Hooks

Mongolia let you define some hooks on your models that will be triggered after a mongoDB command.

  * `beforeInsert(documents, callback)`: triggered *before* an `insert`.
  * `afterInsert(documents, callback)`: triggered *after* an `insert.

  * `beforeUpdate(query, update, callback)`: triggered *before* an `update` or `findAndModify` command.
  * `afterUpdate(query, update, callback)`: triggered *after* an `update` or `findAndModify` command.

  * `beforeRemove(query, callback)`: triggered *before* a `remove` command.
  * `afterRemove(query, callback)`: triggered *after* a `remove` command.

Example:

``` javascript
var COMMENT = require('mongolia').model(db, 'comments'),
    Post = require('./post');

COMMENT.beforeInsert = function (documents, callback) {
  documents.forEach(function (doc) {
    doc.created_at = new Date();
  });
  callback(null, documents);
};

COMMENT.atferInsert = function (documents, callback) {
  documents.forEach(function (doc) {
    Post(db).mongo('update', {_id: doc.post._id}, {'$inc': {num_posts: 1}}); // fire and forget
  });
  callback(null, documents);
};

USER.mongo('insert', {email: 'foo@bar.com'});
// stored => {email: 'foo@bar.com', created_at: Thu, 14 Jul 2011 12:13:39 GMT}
// Post#num_posts is increased
```

## Embedded documents

Mongolia helps you to _denormalize_ your mongo database.

### getEmbeddedDocument

Filters document following the `skeletons` attribute.

    getEmbeddedDocument(name, object, scope [, dot_notation]);

Example:

``` javascript
var POST = require('mongolia').model(db, 'posts');

// only embed the comment's _id, and title
POST.skeletons = {
  comment: ['_id', 'title', 'post.name']
};

var comment = {'_id': 1, title: 'foo', body: 'Lorem ipsum', post: {_id: 1, name: 'bar'}}
console.log(Post(db).getEmbeddedDocument('comment', comment));
// outputs => {'_id': 1, title: 'foo', post: {name: 'bar'}};

console.log(Post(db).getEmbeddedDocument('comment', comment, 'post'));
// outputs => {post: {'_id': 1, title: 'foo', post: {name: 'bar'}}};

console.log(Post(db).getEmbeddedDocument('comment', comment, 'posts', true));
// outputs => {'posts._id': 1, 'posts.title': 'foo', 'posts.post.name': 'bar'};
```

### updateEmbeddedDocument

Updates an embed object following the `skeletons` directive.

``` javascript
Model.updateEmbeddedDocument(query, document_name, document[, options, callback]);
```

Example:

``` javascript
module.exports = function (db) {
  var USER = require('mongolia').model(db, 'users');

  // After updating a user, we want to update denormalized Post.author foreach post
  USER.afterUpdate = function (query, update, callback) {
    Post(db).updateEmbeddedDocument({_id: query._id}, 'author', update, {upsert: false}, callback);
  };

  return USER;
};
```

### pushEmbeddedDocument

Pushes an embedded document following the `skeletons` directive.

``` javascript
Model.pushEmbeddedDocument(query, data, name[, options, callback]);
```

Example:

``` javascript
module.exports = function (db) {
  var POST = require('mongolia')(db, 'posts');

  // After inserting a post, we want to push it to `users.posts[]`
  POST.afterInsert = function (documents, callback) {
    User(db).pushEmbeddedDocument({_id: documents[0].author._id}, 'posts', document, callback);
  };

  return POST;
}
```

## Create and update using validations

Mongolia provides two methods that allow you to create and update using the `validator`.

``` javascript
Model.validateAndInsert(document[, options, callback(error, validator)]);
Model.validateAndUpdate(document, update[, options, callback(error, validator)]);
```

To scope the insert/update within a namespace, use `options.namespace`.

In order to validate an insertion/update, the model have to implement a `validate` function on your model.

``` javascript
validate(query, update, callback);
```

Example:

``` javascript
// post.js
module.exports = function (db) {
  var POST = require('mongolia').model(db, 'posts');

  POST.validate = function (query, update, callback) {
    var validator = require('mongolia').validator(query, update);

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
      console.log(validator.updated_document);
    }
  }
);
```

# Validator

Mongolia validator accepts a document and an update.

If you are validating an insert, the document will be an empty object `{}` and the update
the document you are inserting.

Mongolia will resolve the update client side exposing a `updated_document`.

``` javascript
var validator = require('mongolia').validator({foo: 1}, {'$inc': {foo: 1}});

if (validator.updated_document.foo > 1) {
  validator.addError('foo', 'foo must be ONE');
}
console.log(validator.hasError('foo')); // => true
```

All the methods listed below accept `dot_notation`.

## API

Returns true if the validator is handling an updateInstance operation.

``` javascript
isUpdating()
```

Returns true if the validator is handling an createInstance operation.

``` javascript
isInserting()
```

Returns true if the attributed changed

``` javascript
attrChanged(attr)
```

Adds an error to your validator. Accept dot notation to add nested errors.

``` javascript
addError(field, value)
```

Returns true if the attributed failed a validation. Accept dot notation to check nested errors.

``` javascript
hasError(field)
```

Returns true if any attributed failed a validation

``` javascript
hasErrors()
```

It fills your validator with errors if any of the elements are empty

``` javascript
validateExistence({
  attr: 'Error message'
, attr: ...
})
```

It fills your validator with errors if any of the elements fail the regex

``` javascript
validateRegex({
  attr: [/regex/, 'Error message']
, attr: ...
})
```

It fills your validator with errors if any of the elements fail the confirmation (good for passwords)

``` javascript
validateConfirmation({
  attr: ['confirmation_attr', 'Error message']
, attr: ...
})
```

It fills your validator with errors if any of the queries fail (good to avoid duplicated data)

``` javascript
validateQuery({
  attr: [Model, query, false, 'Error message']
, attr: ...
}, callback)
```

Example using some of the validator features:

``` javascript
var User = function (db) {
  var USER = require('mongolia').model(db, 'users');

  USER.validate = function (document, update, callback) {
    var validator = require('mongolia').validator(document, update)
      , updated_document = validator.updated_document;

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

    if (!updated_document.tags || updated_document.tags.length <= 0) {
      validator.addError('tags', 'Select at least one tag');
    }

    validator.validateQuery({
      email: [
        this
      , {_id: {'$not': document._id}, email: updated_document.email}
      , false
      , 'There is already a user with this email'
      ]
    }, function () {
      callback(null, validator);
    });
  }

  return USER;
};
```

## Tests

Mongolia is fully tested using [testosterone](http://github.com/masylum/testosterone)
To run the tests use:

```bash
make
```

## Example

Monoglia has a fully working blog example on the `example` folder.

## Contributors

In no specific order.

  * Josep M. Bach ([txus](http://github.com/txus))
  * Pau Ramon ([masylum](http://github.com/masylum))

## License

(The MIT License)

Copyright (c) 2010-2011 Pau Ramon Revilla &lt;masylum@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
