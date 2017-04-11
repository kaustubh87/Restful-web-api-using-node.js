var url = require('url');
var express = require('express');
var authenticator = require('./authenticator');
var config = require('./config');

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

app.listen(config.port, function(req,res){
   console.log('Express started at port no ' +config.port); 
});