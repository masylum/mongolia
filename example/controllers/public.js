module.exports = function (APP) {
  var app = APP.app;

  app.get('/', function (req, res) {
    res.render('public/index', {
      title: 'home',
      users: [{_id: 1, name: 'zemba'}, {_id: 1, name: 'fleiba'}],
      posts: [{_id: 1, title: 'foo'}, {_id: 1, title: 'bar'}],
      comments: [{body: 'Functions are the main building block of JavaScript. Functions define the behaviour of things like closures, ‘this’, global variables vs. local variables… Understanding the functions is the first step to truly understand how JavaScript works', post: {title: 'fuck yeah'}}, {body: 'Just trolling', post: {title: 'kalandracaaa'}}, {body: 'Fuck yeah!', post: {title: 'fliebaaa'}}]
    });
  });
};
