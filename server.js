/*
author: Dorian de Koning
last changed: 11-12-2015
*/
/* Load HTTP required packages */
var request = require('request');
var express = require('express');
var querystring = require('querystring');
/* setup server */
var server = express();
/* Keep these secret! */
var client_id = '[clientid]';
var client_secret = '[clientsecret]';
/* call back function to be called by spotify auth */
var callback = 'http://80.100.203.254:8888/callback';
//var url = 'https://accounts.spotify.com/request_token';
// Called when auth fails
server.get("/auth-error", function (req, res) {
	res.set({'Content-Type': 'text/json'});
	res.end(JSON.stringify({"error" : 'authentication unsuccesfull',
							"reason" : req.query.error}));
});
// Called when auth is succesfull
server.get("/logedin", function (req, res) {
	res.set({'Content-Type': 'text/html'});
	res.end(JSON.stringify({"access-token" : req.query.access_token,
							"refresh-token" : req.query.refresh_token}));
});
// Page to authenticate
server.get("/auth", function (req, res) {
	var uri = 'https://accounts.spotify.com/authorize?' +
			querystring.stringify({
				response_type: 'code',
				client_id: client_id,
				redirect_uri: callback
			});
	res.redirect(uri);
});
// Callback for spotify auth service
server.get("/callback", function (req, res) {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code:  require('url').parse(req.url, true).query.code,
        redirect_uri: callback,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };
	request.post(authOptions, function(error, response, body){
		if(!error && response.statusCode === 200){
			var access_token = body.access_token;
			var refresh_token = body.refresh_token;
			res.redirect("/logedin?access_token=" + access_token + "&refresh_token=" + refresh_token);
		}else{
			res.redirect("/auth-error?error=unsuccesfulllogin");
		}

	});
});
// Called when token needs to be refreshed
server.get('/refresh_token', function(req, res){
	// Request parameters
	var requestParams = {
     	url: 'https://accounts.spotify.com/api/token',
      	form: {
        	refresh_token: req.query.refresh_token,
        	grant_type: 'refresh_token'
      	},
      	headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      	},
      	json: true
    };
    request.post(requestParams, function(error, response, body){
    	if(!error && response.statusCode===200) {
    		res.send({'access_token' : body.access_token})
    	}else{
    		res.redirect("/auth-error?error=ref-token")
    	}
    });
});
/* Start server */
server.listen(8888);
console.log("Server running at port: 8888");
