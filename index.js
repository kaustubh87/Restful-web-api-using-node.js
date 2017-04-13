var url = require('url');
var express = require('express');
var authenticator = require('./authenticator');
var config = require('./config');
var querystring = require('querystring');
var async = require('async');

var app = express();

//Use cookie parser as a dependency
app.use(require('cookie-parser')());

//Take user to Twitter's login page
app.get('/auth/twitter', authenticator.redirectToTwitterLoginPage);

//Callback when the user is signed in

app.get(url.parse(config.oauth_callback).path, function(req,res){
    authenticator.authenticate(req,res,function(err){
       if(err){
           console.log(err);
           res.sendStatus(401);
       }
        else{
            res.send('Authentication Successful');
        }
        
    });
    
});

app.get('/', function(req,res){
   res.send('Index page'); 
});

//Post a tweet
app.get('/tweet', function(req,res){
   if(!req.cookies.access_token || !req.cookies.access_token_secret){
       return res.sendStatus(401);
   }
    
   authenticator.post('https://api.twitter.com/1.1/statuses/update.json',
                     req.cookies.access_token, req.cookies.access_token_secret,
                     {
                        status: "Hello Twitter REST API"
   },
                     
        function(err, data){
       if(err){ 
           return res.status(400).send(err);
              }
       res.send("Tweet Successful");
   });    
});

// Search for tweets
app.get('/search', function(req,res){
    
    if(!req.cookies.access_token || !req.cookies.access_token_secret){
        return res.sendStatus(401);
    }
    
    authenticator.get('https://api.twitter.com/1.1/search/tweets.json?' + querystring.stringify({q: 'H1B'}), req.cookies.access_token, req.cookies.access_token_secret, function(err, data){
       if(err)
           {
               return res.status(400).send(err);
           }
        res.send(data);
    });
    
});

//List all friends

app.get('/friends', function(req, res) {
	if (!req.cookies.access_token || !req.cookies.access_token_secret) {
		return res.sendStatus(401);
	}

	var url = 'https://api.twitter.com/1.1/friends/list.json';
	if (req.query.cursor) {
		url += '?' + querystring.stringify({ cursor: req.query.cursor });
	}

	authenticator.get(url,
		req.cookies.access_token, req.cookies.access_token_secret,
		function(error, data) {
			if (error) {
				return res.status(400).send(error);
			}

			res.send(data);
		});
});

//Get all friends

app.get('/all-friends', function(req,res){
   async.waterfall([
       function(cb){
           var cursor = -1;
           var ids = [];
           
           //Get ids by traversing the cursored collection
           
           async.whilst(function(){
               return cursor!=0;
           },
                        function(cb){
               authenticator.get('https://api.twitter.com/1.1/friends/ids.json?' +querystring.stringify({user_id: req.cookies.twitter_id, cursor: cursor}),
                            req.cookies.access_token, req.cookies.access_token_secret, function(err, data){
                   if (err){
                       return res.status(400).send(err);
                   }
                   
                   data = JSON.parse(data);
                   cursor = data.next_cursor_str;
                   id = ids.concat(data.ids);
                   
                   cb();
               });
           }, function(err){
               if(err){
                   return res.status(500).send(err)
               }
               cb(null, ids);
           });
       },
       
       //Get friends data
       
   ]) 
});

app.listen(config.port, function(req,res){
   console.log('Express started at port no ' +config.port); 
});