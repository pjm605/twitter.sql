'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var client = require('../db')

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    
    client.query('SELECT * from users Join tweets on tweets.userid = users.id', function (err, result) {
  if (err) return next(err); // pass errors to Express
  var tweets = result.rows;
  console.log(tweets)
  res.render('index', { title: 'Twitter.js', tweets: tweets, showForm: true });
});

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

  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){

    client.query('SELECT tweets.content, users.name, users.pictureurl FROM tweets JOIN users ON tweets.userid=users.id WHERE tweets.id = $1', [req.params.id], function (err, result)  {
      if (err) return next(err);
      res.render('index', {
      title: 'Twitter.js',
      tweets: result.rows // an array of only one element ;-)
    });

    })

  });

  // create a new tweet
  router.post('/tweets', function(req, res, next) {
    client.query('SELECT id FROM users WHERE name = $1', [req.body.name], function (err, result) {
      if(err) return next (err);
      
      //console.log(result.rows)
      if(result.rows.length === 0) {
        client.query('INSERT INTO users (name) VALUES ($1)', [req.body.name], function (err, result) {
          if(err) return next(err);
        });
      client.query('SELECT id FROM users WHERE name=$1', [req.body.name], function (err, result) {
          if (err) return next(err);

          client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [result.rows, req.body.content], function (err, result) {
          if (err) return next(err);
          res.redirect('/');
        });

        });
        
      } 
      else {
        var id = result.rows[0]['id'];

        client.query('INSERT INTO tweets (userid, content) VALUES ($1, $2)', [id, req.body.content], 
          function (err, result) {if(err) return next(err); });
        client.query('INSERT INTO tags (tag) VALUES ($1)', [req.body.hashtag], function (err, result) {
           if (err) return next(err);
        });
        client.query('SELECT id FROM tags WHERE tag = $1', [req.body.hashtag], function (err, result) {
          if (err) return next(err);
          else {
            var tagID = result.rows[0]['id'];
            client.query('SELECT id FROM tweets WHERE content=$1', [req.body.content], function (err, result) {
              if (err) return next (err);
              else {
                var tweetID = result.rows[0]['id'];
                client.query('INSERT INTO tags_tweets (tag_id, tweet_id) VALUES ($1, $2)', [tagID, tweetID], function (err, result) {if (err) 
                return next(err);
                else res.redirect('/');});
              }
            })}
        });
      }


        })});


  return router;
}