'use strict';
var fs = require('fs');

module.exports = {

	"setup": function (config, result, callback) {

		var returnObj = result,
			driver = result.driver;
		returnObj.screenshot = {
			"snap": function (filename) {
				var deferred = result.wd.promise.defer(),
					iterationLabel = (result.iterationLabel) ? "-" + result.iterationLabel : "",
					imagePath,
					imageName,
					imageObj = {"imageName": null, "imagePath": null};
				driver.takeScreenshot().then(function (screenImg) {
					imageName = filename + iterationLabel + ".png";
					imagePath = result.autoBaseDir + "/report/";
					imageObj.imageName = imageName;
					imageObj.imagePath = imagePath;
					//Jenkins stuff
					if (process.env.JENKINS_URL) {
						var wspace = process.env.WORKSPACE,
							jurl = process.env.JENKINS_URL,
							jname = process.env.JOB_NAME,
							relativeImagePath = imagePath.substr(wspace.length),
							wsImageUrl = jurl + "job/" + jname + "/ws" + relativeImagePath + imageName;
						imageObj.imageUrl = wsImageUrl;
					}
					//save screen image
					fs.writeFile(imagePath + imageName, screenImg, {"encoding": "base64"}, function (err) {
						if (err) {
							deferred.reject(err);
						} else {
							deferred.fulfill(imageObj);
						}

					});
				});
				return deferred;
			},
			"doneError": function (filename, err, done) {
				this.snap(filename).
					then(function (imageObject) {
						var output = (imageObject.imageUrl) ? "\nnemo-screenshot\n" + imageObject.imageUrl + "\n" : "\nnemo-screenshot::" + JSON.stringify(imageObject) + "::nemo-screenshot";
						err.stack = err.stack + output;
						done(err);
					});
			}
		};
		callback(null, config, returnObj);

	}
};