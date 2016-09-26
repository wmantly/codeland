var express = require('express');
var router = express.Router();

/* GET home page. */

module.exports = function(app){
	
	app.get('/', function(req, res, next) {
		req.session.name = "mine";
		console.log('http',req.session)
		res.render('index', { title: 'Express' });
	});

	app.get('/test', function(req, res, next){
		req.session.testing = "mine";
		console.log('http',req.session);
		res.render('index', { title: 'test page'});
	});

};
