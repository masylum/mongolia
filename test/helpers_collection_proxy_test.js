/*globals describe, it, beforeEach, afterEach*/
var assert = require('assert')
  , sinon = require('sinon')
  , CollectionProxy = require('./../lib/helpers/collection_proxy')
  , noop = function () {
      return function () {};
    }
  , Collection = { update: noop(), insert: noop(), findArray: noop()
                 , find: noop(), findAndModify: noop(), mapReduce: noop(), remove: noop()}
  , Model;

function stubGetCollection(sinon) {
  var stub = sinon.stub(Model, 'getCollection', function (_callback) {
    _callback(null, Collection);
    stub.restore();
  });
}

describe('collection proxy test', function () {

  beforeEach(function () {
    Model = require('../').model({}, 'models');
  });

  describe('proxy', function () {
    it('delegates every call to collection_proxy or native driver collection functions', sinon.test(function () {
      var cb = function cb() {}
        , self = this
        , stub
        , args = ['zemba', cb];

      ['update', 'insert', 'findArray'].forEach(function (method) {
        stubGetCollection(self);
        stub = self.stub(CollectionProxy, method).withArgs(Model, Collection, args, cb);
        CollectionProxy.proxy(Model, {method: method, hooks: true}, args, cb);
        sinon.assert.calledOnce(stub);
      });

      ['find', 'update', 'insert'].forEach(function (method) {
        stubGetCollection(self);
        stub = self.stub(Collection, method).withArgs(args[0], args[1]);
        CollectionProxy.proxy(Model, {method: method, hooks: false}, args, cb);
        sinon.assert.calledOnce(stub);
      });
    }));

    describe('namespace', function () {
      var cb, args;

      beforeEach(function () {
        cb = function () {};
        args = [{foo: 'bar'}, cb];

        Model.namespaces = {foo: ['zemba', 'fleiba']};
      });

      it('modifies the arguments if `namespace` is set to `true`', sinon.test(function () {
        var self = this, stub1, stub2;

        stubGetCollection(self);
        stub1 = self.stub(CollectionProxy.namespacer, 'filter').withArgs(Model.namespaces, 'foo', 'find', args);
        stub2 = self.stub(Collection, 'find').withArgs(args[0], args[1]);

        CollectionProxy.proxy(Model, {method: 'find', namespace: 'foo', namespacing: true}, args, cb);
        sinon.assert.calledOnce(stub1);
        sinon.assert.calledOnce(stub2);
      }));

      it('doesnt modify the arguments if `namespace` is set to `false`', sinon.test(function () {
        var self = this, stub;

        stubGetCollection(self);
        stub = self.stub(Collection, 'find').withArgs(args[0], args[1]);

        CollectionProxy.proxy(Model, {method: 'find', namespace: 'foo', namespacing: false}, args, cb);
        sinon.assert.calledOnce(stub);
      }));
    });

    describe('maps', function () {
      var cb, args;

      beforeEach(function () {
        cb = function () {};
        args = [{foo: 'bar', _id: '3'}, cb];

        Model.maps = {foo: Boolean};
      });

      it('maps the arguments according if the `mapping` option is set to `true`', sinon.test(function () {
        var self = this, stub1, stub2;

        stubGetCollection(self);
        stub1 = self.stub(CollectionProxy.mapper, 'map').withArgs({foo: Boolean}, 'find', args);
        stub2 = self.stub(Collection, 'find').withArgs(args[0], args[1]);

        CollectionProxy.proxy(Model, {method: 'find', mapping: true}, args, cb);
        sinon.assert.calledOnce(stub1);
        sinon.assert.calledOnce(stub2);
      }));

      it('does not map the arguments if the `mapping` option is set to `false`', sinon.test(function () {
        var self = this, stub;

        stubGetCollection(self);
        stub = self.stub(Collection, 'find').withArgs(args[0], args[1]);

        CollectionProxy.proxy(Model, {method: 'find', mapping: false}, args, cb);
        sinon.assert.calledOnce(stub);
      }));
    });

    it('can be called with no callback', sinon.test(function () {
      var args = ['zemba']
        , stub
        , self = this;

      ['update', 'insert', 'findArray'].forEach(function (method) {
        stubGetCollection(self);
        stub = self.stub(CollectionProxy, method, function (m, c, a, callback) {
          assert.equal(typeof callback, 'function');
        });

        CollectionProxy.proxy(Model, {method: method, hooks: true}, args);
        sinon.assert.calledOnce(stub);
      });

      ['find', 'update', 'insert'].forEach(function (method) {
        stubGetCollection(self);
        stub = self.stub(Collection, method, function (args, callback) {
          assert.equal(typeof callback, 'undefined');
        });

        CollectionProxy.proxy(Model, {method: method, hooks: false}, args);
        sinon.assert.calledOnce(stub);
      });
    }));
  });

  describe('findArray', function () {
    it('calls find on a collection with some arguments', sinon.test(function () {
      var cb = function (error, cursor) {}
        , self = this
        , stub1, stub2
        , cursor = {toArray: function () {}}
        , error_result = null
        , args = ['fleiba', cb];

      stub1 = self.stub(Collection, 'find', function (_collection, _args) {
        assert.deepEqual(_collection, args[0]);
        stub2 = self.stub(cursor, 'toArray');
        args[args.length - 1](null, cursor);
      });

      CollectionProxy.findArray(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
    }));
  });

  describe('insert', function () {
    it('inserts a record', sinon.test(function () {
      var callback_called = false
        , self = this
        , stub1, stub2, stub3
        , cb = function (error, ret) {
            assert.deepEqual(error, null);
            assert.deepEqual(ret, [1, 2, 3]);
            callback_called = true;
          }
        , args = ['fleiba', cb];

      stub1 = self.stub(Model, 'beforeInsert', function (ar, callback) {
        assert.deepEqual(ar, args[0]);

        stub2 = self.stub(Collection.insert, 'apply', function (_collection, _args) {
          assert.deepEqual(_collection, Collection);
          assert.deepEqual(_args[0], ['document1', 'document2']);

          stub3 = self.stub(Model, 'afterInsert', function (_docs, _callback) {
            assert.deepEqual(_docs, ['document1', 'document2']);
            _callback(null);
            assert.ok(callback_called);
          });

          _args[1](null, [1, 2, 3]);
        });

        callback(null, ['document1', 'document2']);
      });

      CollectionProxy.insert(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
      sinon.assert.calledOnce(stub3);
    }));
  });

  describe('update', function () {
    it('finds and modifies a record', sinon.test(function () {
      var callback_called = false
        , self = this
        , stub1, stub2, stub3
        , cb = function (error, ret) {
            assert.deepEqual(error, null);
            assert.deepEqual(ret, [1, 2, 3]);
            callback_called = true;
          }
        , args = [{name: 'zemba'}, {'$set': {name: 'foo'}}, {}, cb];

      stub1 = sinon.stub(Model, 'beforeUpdate', function (_query, _update, _callback) {
        assert.deepEqual(_query, args[0]);
        assert.deepEqual(_update, args[1]);
        _update.$set.updated_at = 123;

        stub2 = sinon.stub(Collection.update, 'apply', function (_collection, _args) {
          assert.deepEqual(_collection, Collection);
          assert.deepEqual(_args[0], args[0]);
          assert.deepEqual(_args[1].$set.updated_at, 123);

          stub3 = sinon.stub(Model, 'afterUpdate', function (_doc, _update, _callback) {
            assert.deepEqual(_doc, args[0]);
            assert.deepEqual(_update, args[1]);
            _callback(null);
            assert.ok(callback_called);
          });

          _args[3](null, [1, 2, 3]);
        });

        _callback(null, _query, _update);
      });

      CollectionProxy.update(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
      sinon.assert.calledOnce(stub3);
    }));
  });

  describe('findAndModify', function () {
    it('finds and modifies a record', sinon.test(function () {
      var callback_called = false
        , self = this
        , stub1, stub2, stub3
        , cb = function (error, ret) {
            assert.deepEqual(error, null);
            assert.deepEqual(ret, [1, 2, 3]);
            callback_called = true;
          }
        , args = [{name: 'zemba'}, [], {'$set': {name: 'foo'}}, {}, cb];

      stub1 = self.stub(Model, 'beforeUpdate', function (_query, _update, _callback) {
        assert.deepEqual(_query, args[0]);
        assert.deepEqual(_update, args[2]);
        _update.$set.updated_at = 123;

        stub2 = self.stub(Collection.findAndModify, 'apply', function (_collection, _args) {
          assert.deepEqual(_collection, Collection);
          assert.deepEqual(_args[0], args[0]);
          assert.deepEqual(_args[2].$set.updated_at, 123);

          stub3 = self.stub(Model, 'afterUpdate', function (_doc, _update, _callback) {
            assert.deepEqual(_doc, args[0]);
            assert.deepEqual(_update, args[2]);
            _callback(null);
            assert.ok(callback_called);
          });

          _args[4](null, [1, 2, 3]);
        });

        _callback(null, _query, _update);
      });

      CollectionProxy.findAndModify(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
      sinon.assert.calledOnce(stub3);
    }));
  });

  describe('mapReduceCursor', function () {
    var args, stub1, stub2, coll, cb;

    beforeEach(function () {
      args = ['a', 'b'];
      coll = {find: function () {}};
    });

    it('calls `mapReduce` returning a cursor if no intermediate errors occur', sinon.test(function () {
      var self = this;

      stub1 = self.stub(Collection.mapReduce, 'apply', function (_collection, _args) {
        assert.equal(_collection, Collection);
        assert.equal(_args, args);

        stub2 = self.stub(coll, 'find', function (callback) {
          assert.ok(callback);
        });

        _args[1](null, coll);
      });

      cb = function () {};

      CollectionProxy.mapReduceCursor(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
    }));

    it('calls `mapReduce` returning an error if an intermediate error occurs', sinon.test(function () {
      var self = this
        , error = 'could not access the DB';

      stub1 = self.stub(Collection.mapReduce, 'apply', function (_collection, _args) {
        assert.equal(_collection, Collection);
        assert.equal(_args, args);
        _args[1](error, coll);
      });

      stub2 = self.spy().withArgs(error, null);

      CollectionProxy.mapReduceCursor(Model, Collection, args, stub2);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
    }));
  });

  describe('mapReduceArray', function () {
    it('returns a `mapReduceCursor` to Array', sinon.test(function () {
      var cb = function () {}
        , self = this
        , stub1, stub2
        , args = ['fleiba', cb]
        , cursor = {toArray: function () {}};

      stub1 = self.stub(CollectionProxy, 'mapReduceCursor', function (_model, _collection, _args, _callback) {
        assert.equal(_model, Model);
        assert.equal(_collection, Collection);
        assert.equal(_args, args);

        stub2 = self.stub(cursor, 'toArray').withArgs(cb);

        _callback(null, cursor);
      });

      CollectionProxy.mapReduceArray(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
    }));
  });

  describe('remove', function () {
    it('removes a document', sinon.test(function () {
      var callback_called = false
        , self = this
        , stub1, stub2, stub3
        , cb = function (error, ret) {
            assert.deepEqual(error, null);
            assert.deepEqual(ret, [1, 2, 3]);
            callback_called = true;
          }
        , args = ['fleiba', cb];

      stub1 = self.stub(Model, 'beforeRemove', function (_query, _callback) {
        assert.deepEqual(_query, args[0]);

        stub2 = self.stub(Collection.remove, 'apply', function (_collection, _args) {
          assert.deepEqual(Collection, _collection);
          assert.deepEqual(_args[0], args[0]);

          stub3 = self.stub(Model, 'afterRemove', function (_query, _callback) {
            assert.deepEqual(_query, args[0]);
            _callback(null);
            assert.ok(callback_called);
          });

          _args[1](null, [1, 2, 3]);
        });

        _callback(null, _query);
      });

      CollectionProxy.remove(Model, Collection, args, cb);
      sinon.assert.calledOnce(stub1);
      sinon.assert.calledOnce(stub2);
      sinon.assert.calledOnce(stub3);
    }));
  });
});
