module.exports = function(app) {
	app.get('/', function(request, response) {
		response.sendfile('public/analytics.html');
	});
	app.get('/api/log', function(req, res) {
		var fs = require("fs");
		var LOGS_DIR = "logs";

		fs.readdir("./" + LOGS_DIR, function(err, files) {
			//holds the files found on dir 
			var dataArr = [];
			//indicates the number of files read
			var workDone = 0;
			for (var i = 0; i < files.length; i++) {
				var fileName = files[i];
				fs.readFile(LOGS_DIR + "/" + fileName, 'utf8', function(err, data) {

					if (err) throw err;

					dataArr.push(data);

					workDone++;
					if (workDone == files.length)
						res.send(dataArr);

				});
			}
		})
	});
};