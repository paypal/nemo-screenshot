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
						err.stack = err.stack + "\nnemo-screenshot::" + JSON.stringify(imageObject) + "::nemo-screenshot";
						done(err);
					});
			}
		};
		callback(null, config, returnObj);

	}
};