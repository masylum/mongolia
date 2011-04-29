var testosterone = require('testosterone')({post: 3000, title: 'integration/integration_test.js'}),
    gently = new (require('gently')),
    assert = testosterone.assert,

    Model = require('./../../lib/model'),
    mongodb = require('mongodb'),
    Db = mongodb.Db,
    Server = mongodb.Server,
    db = new Db('mongolia_test', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {}),

    remove_users = function (cb) {
      db.collection('users', function (error, collection) {
        collection.remove({}, function () {
          db.collection('countries', function (error, collection) {
            collection.remove({}, cb);
          });
        });
      });
    };

db.open(function () {
  remove_users(function () {

    testosterone

      .add('Insert documents with before/afterCreate hooks', function (done) {
        var User = Model(db, 'users'),
            Country = Model(db, 'countries');

        User.beforeCreate = function (documents, callback) {
          documents.forEach(function (document) {
            document.has_country = true;
          });
          callback(null, documents);
        };

        User.afterCreate = function (documents, callback) {
          documents.forEach(function (document) {
            document.comments = [];
          });
          callback(null, documents);
        };

        Country.mongo('insert', {name: 'Andorra'}, function (error, docs) {
          var doc = docs[0];
          assert.equal(doc.name, 'Andorra');
          assert.ok(doc.created_at);

          User.mongo('insert', {name: 'zemba', country: doc}, done(function (error, docs) {
            var doc = docs[0];
            assert.equal(doc.name, 'zemba');
            assert.equal(doc.has_country, true);
            assert.deepEqual(doc.country.name, 'Andorra');
            assert.deepEqual(doc.comments, []);
          }));
        });
      })

      .add('Update embedded documents', function (done) {
        var User = Model(db, 'users'),
            Country = Model(db, 'countries');

        Country.mongo('findOne', {name: 'Andorra'}, function (error, doc) {
          User.updateEmbeddedDocument(doc._id, 'country', {name: 'France'}, {}, function (error, update) {
            assert.equal(update.$set['country.name'], 'France');

            User.mongo('findOne', {name: 'zemba'}, done(function (error, doc) {
              assert.equal(doc.country.name, 'France');
            }));
          });
        });
      })

      .add('Push embedded documents', function (done) {
        var User = Model(db, 'users');

        User.mongo('findOne', {name: 'zemba'}, function (error, doc) {
          var funk = require('funk')();

          User.pushEmbeddedDocument(doc._id, 'comments', {body: 'bla bla bla'}, {}, funk.add(function (error, doc) {
            assert.equal(doc.$push['comments.body'], 'bla bla bla');
          }));

          User.pushEmbeddedDocument(doc._id, 'comments', {body: 'trolling bla'}, {}, funk.add(function (error, doc) {
            assert.equal(doc.$push['comments.body'], 'trolling bla');
          }));

          funk.parallel(done);
        });
      })

      .add('Remove documents with beforeRemove and afterRemove hooks', function (done) {
        var User = Model(db, 'users'),
            query = {name: 'zemba'},
            calledBefore = false,
            calledAfter = false;

        User.beforeRemove = function (qry, callback) {
          calledBefore = true;
          assert.deepEqual(query, qry);
          callback(null, query);
        };

        User.afterRemove = function (qry, callback) {
          calledAfter = true;
          assert.deepEqual(query, qry);
          callback(null, query);
        };

        User.mongo('remove', {name: 'zemba'}, done(function (error, query) {
          assert.ok(calledBefore);
          assert.ok(calledAfter);
          assert.deepEqual(query, {name: 'zemba'});
          User.mongo('findArray', {}, function (error, docs) {
            console.log(docs);
            done();
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

      .run();
  });
});
