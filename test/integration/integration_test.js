var testosterone = require('testosterone')({post: 3000, title: 'integration/integration_test.js'}),
    gently = new (require('gently')),
    assert = testosterone.assert,

    Model = require('./../../lib/model'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Server = mongodb.Server,
    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {}),

    remove_users = function () {
      db.collection('users', function (error, collection) {
        collection.remove({}, function (error, bla) {});
      });
    };

db.open(function () {

  remove_users();

  testosterone

    .add('Insert documents with before/afterCreate hooks', function (done) {
      var User = Model(db, 'users');

      User.beforeCreate = function (elements, callback) {
        elements.forEach(function (element) {
          element.foo = 'bar';
        });
        callback(null, elements);
      };

      User.afterCreate = function (elements, callback) {
        elements.forEach(function (element) {
          element._id = 'forlayo';
        });
        callback(null, elements);
      };

      User.mongo('insert', {name: 'zemba'}, done(function (error, docs) {
        var zemba = docs[0];

        assert.equal(zemba.name, 'zemba');
        assert.equal(zemba.foo, 'bar');
        assert.equal(zemba._id, 'forlayo');
      }));
    })

    .add('Push and update embedded documents', function (done) {
      var User = Model(db, 'users');

      User.mongo('insert', {name: 'zemba'}, done(function (error, docs) {
        var zemba = docs[0];

        User.pushEmbeddedDocument(zemba._id, 'countries', {country: 'Spain'}, {}, function (error, docs) {
          assert.equal(docs.$push.countries.country, 'Spain');
        });

        User.updateEmbeddedDocument(zemba._id, 'countries', {country: 'France'}, {}, function (error, docs) {
          assert.equal(docs.$set.countries.country, 'France');
        });
      }));
    })

    .add('Remove documents with beforeRemove and afterRemove hooks', function (done) {
      var User = Model(db, 'users'),
          calledBefore = false,
          calledAfter = false;

      User.beforeRemove = function (query, callback) {
        calledBefore = true;
        callback(null, query);
      };

      User.afterRemove = function (query, callback) {
        calledAfter = true;
        callback(null, query);
      };

      User.mongo('findArray', {}, function (error, docs) {
        console.log(docs);
      });
      User.mongo('remove', {name: 'zemba'}, done(function (error, query) {
        assert.ok(calledBefore);
        assert.ok(calledAfter);
        assert.deepEqual(query, {name: 'zemba'});
        User.mongo('findArray', {}, function (error, docs) {
          console.log(docs);
        });
      }));
    })

    .add('validateAndInsert validates and inserts', function (done) {
      var User = Model(db, 'users');

      User.validate = function (document, update, callback) {
        var validator = require('./../../lib/validator')(document);

        if (update.name !== 'zemba') {
          validator.addError('name', 'We only love Zemba here');
        }

        callback(null, validator);
      };

      User.validateAndInsert({name: 'zemba'}, done(function (error, validation) {
        assert.equal(validation.updated_model.name, 'zemba');
        assert.deepEqual(validation.errors, {});

        // Try to insert an invalid record
        User.validateAndInsert({name: 'barbaz'}, function (error, validation) {
          assert.deepEqual(validation.errors.name, ['We only love Zemba here']);
        });
      }));
    })

    .add('validateAndUpdate validates and updates', function (done) {
      var User = Model(db, 'users');

      User.mongo('insert', {name: 'John Smith', age: 30}, function (errors, documents) {});

      User.validate = function (document, update, callback) {
        var validator = require('./../../lib/validator')(document);

        if (update.name !== 'zemba') {
          validator.addError('name', 'We only love Zemba here');
        }

        callback(null, validator);
      };

      User.validateAndUpdate({name: 'John Smith'}, {name: 'foobar'}, done(function (error, validation) {
        assert.deepEqual(validation.errors.name, ['We only love Zemba here']);
        assert.deepEqual(validation.updated_model.name, 'John Smith');

        User.validateAndUpdate({name: 'John Smith'}, {name: 'zemba'}, function (error, validation) {
          assert.deepEqual(validation.errors, {});
        });
      }));
    })

    .run(function () {
      require('sys').print('done!');
    });

});
