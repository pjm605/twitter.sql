'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db')

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    
    client.query('SELECT * FROM tweets', function (err, result) {
  if (err) return next(err); // pass errors to Express
  var tweets = result.rows;
  res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
});
    // var allTheTweets = tweetBank.list();
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: allTheTweets,
    //   showForm: true
    // });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    client.query('SELECT content FROM tweets JOIN users on tweets.userid = users.id where users.name = $1;', 
      [req.params.username], 
      function (err, result) {
        if(err) return next(err);
        res.render('index', {
          title: "Twitter.js",
          tweets: result.rows,
          showForm: true,
          username: req.params.username
        });

    });


    // var tweetsForName = tweetBank.find({ name: req.params.username });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsForName,
    //   showForm: true,
    //   username: req.params.username
    // });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){

    client.query('SELECT * FROM tweets WHERE ID = $1', [req.params.id], function (err, result)  {
      if (err) return next(err);
      res.render('index', {
      title: 'Twitter.js',
      tweets: result.rows // an array of only one element ;-)
    });

    })

    // var tweetsWithThatId = tweetBank.find({ id: Number(req.params.id) });
    // res.render('index', {
    //   title: 'Twitter.js',
    //   tweets: tweetsWithThatId // an array of only one element ;-)
    // });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    client.query('SELECT id FROM users WHERE name = $1', [req.body.name], function (err, result) {
      if(err) return next (err);
      
      //console.log(result.rows)
      if(result.rows.length === 0) {
        
      } 
      else {
        var id = result.rows[0]['id']
        client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [id, req.body.content], function (err, result) {
        if(err) return next (err);
        //io.sockets.emit('new_tweet', result)
         res.redirect('/');
      })
      }

 
    })

    // var newTweet = tweetBank.add(req.body.name, req.body.content);
    // io.sockets.emit('new_tweet', newTweet);
    // res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}