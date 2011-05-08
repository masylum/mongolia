require('colors');

var mongodb = require('mongodb')
  , Db = mongodb.Db
  , Server = mongodb.Server
  , express = require('express')

  , model = require('./../lib/model')
  , validator = require('./../lib/validator')

  , db = new Db('blog', new Server('localhost', 27017, {auto_reconnect: true, native_parser: true}), {})
  , ObjectID = db.bson_serializer.ObjectID

  , app = express.createServer()

  , APP = {
      app: app
    , db: db
    , ObjectID: ObjectID
    , options: {port: 3000}
    , model: model
    , validator: validator
    };

APP.loadModel = function (str) {
  return function () {
    return require('./models/' + str)(APP);
  };
};

// Configure
app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');

  // middlewares
  app.use(express.favicon());
  app.use(express['static'](__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(app.router);
});

// Controllers
require('./controllers/public')(APP);
require('./controllers/users')(APP);
require('./controllers/posts')(APP);

console.log('Opening database '.blue);
db.open(function () {
  app.listen(APP.options.port);
  console.log('Listening port '.green + (APP.options.port).toString().yellow);
});
