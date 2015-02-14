	//dependencies
	var express = require("express");
	var app = express(); // create our app w/ express
	var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
	var http = require('http');

	app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users

	var routes = require('./routes');
	routes(app);

	// listen (start app with node server.js) ======================================
	app.server = http.createServer(app);
	app.server.listen(2002);
	console.log("App listening on port 2002");