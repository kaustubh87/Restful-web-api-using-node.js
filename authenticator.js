var OAuth = require('oauth').OAuth;
var config = require('./config');

//Create oauth Object for accessing twitter with Twitter's api configuration
var oauth = new OAuth(
    config.request_token_url,
    config.access_token_url,
    config.consumer_key,
    config.consumer_secret,
    config.oauth_version,
    config.oauth_callback,
    config.oauth_signature
);


module.exports = {
    redirectToTwitterLoginPage : function(req,res){
        oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret,results){
            if(error){
                console.log(error);
                res.send("Authentication failed");
            }
        else{
                //Use request token to take client to Twitter's Authentication page.
                res.cookie('oauth_token', oauth_token, { httpOnly: true}); //cookies cant be accessibile using js hence used httpOnly
                res.cookie('oauth_token_secret', oauth_token_secret, {httpOnly: true});
                res.redirect(config.authorize_url +'?oauth_token='+oauth_token);
            }
    });
},
    authenticate: function(req,res,cb){
        //Check if request token and temp url are present
        if(!(req.cookies.oauth_token && req.cookies.oauth_token_secret && req.query.oauth_verifier)){
            return cb("Request doesn't have all required keys");
            
        }
        
        //Clear the request token cookies
        res.clearCookie('oauth_token');
        res.clearCookie('oauth_token_secret');
        
        oauth.getOAuthAccessToken(
            req.cookies.oauth_token,
            req.cookies.oauth_token_secret,
            req.query.oauth_verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results){
           if(error){
               return cb(error);
           }
            
            //Get the User's twitter Id
            
            oauth.get('https://api.twitter.com/1.1/account/verify_credentials.json',
                     oauth_access_token, oauth_access_token_secret, function(err, data){
               if(error)
                   
               {
                   console.log(error);
                   return cb(error);
               }
            });
                
            }
        )
        
        //tell router authentication was succesful
        cb();
    }
};