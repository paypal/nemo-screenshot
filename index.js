/*───────────────────────────────────────────────────────────────────────────*\
│  Copyright (C) 2014 eBay Software Foundation                                │
│                                                                             │
│                                                                             │
│   Licensed under the Apache License, Version 2.0 (the "License"); you may   │
│   not use this file except in compliance with the License. You may obtain   │
│   a copy of the License at http://www.apache.org/licenses/LICENSE-2.0       │
│                                                                             │
│   Unless required by applicable law or agreed to in writing, software       │
│   distributed under the License is distributed on an "AS IS" BASIS,         │
│   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
│   See the License for the specific language governing permissions and       │
│   limitations under the License.                                            │
\*───────────────────────────────────────────────────────────────────────────*/
'use strict';
var fs = require('fs');
var path = require('path');
var mkdirRecursive = function(dirPath, mode) {
	try {
		fs.mkdirSync(dirPath, mode);
	}
	catch (error) {
		if (error.code === 'EEXIST' || error.errno === 34) {
			mkdirRecursive(path.dirname(dirPath), mode);
			mkdirRecursive(dirPath, mode);
		}
		else {
			console.log(error);
			return error;
		}
	}
	return false;
};

module.exports = {
	/**
	*	setup - initialize this functionality during nemo.setup
	*	@param screenShotPath {Object} - fs path where screenshots should be saved
	*	@param nemo {Object} - nemo namespace
	*	@param callback {Function} - errback function
	*/
	"setup": function (screenShotPath, nemo, callback) {



		var driver = nemo.driver;
		nemo.screenshot = {
			/**
			*	snap - save a screenshot image as PNG to the "report" directory
			*	@param filename {String} - should be unique within the report directory and indicate which
			*								test it is associated with
			*	@returns {Promise} - upon successful completion, Promise will resolve to a JSON object as below.
			*							If Jenkins environment variables are found, imageUrl will be added
			*							{
			*								"imageName": "myImage.png", 
			*								"/path/to/image/": "val" 
			*								[, "imageUrl": "jenkinsURL"]
			*							}
			*/
			"snap": function (filename) {
				var deferred = nemo.wd.promise.defer(),
					imageName,
					imageObj = {"imageName": null, "imagePath": null};
				driver.takeScreenshot().then(function (screenImg) {
					imageName = filename + ".png";


					var imageDir = path.dirname(path.resolve(screenShotPath, imageName));
					if (!fs.existsSync(imageDir)) {
						var error = mkdirRecursive(imageDir);
						if (error) {
							deferred.reject(error);
						}
					}

					imageObj.imageName = imageName;
					imageObj.imagePath = screenShotPath + imageName;
					//Jenkins stuff
					if (process.env.JENKINS_URL) {
						var wspace = process.env.WORKSPACE,
							jurl = process.env.JENKINS_URL,
							jname = process.env.JOB_NAME,
							relativeImagePath = screenShotPath.substr(wspace.length),
							wsImageUrl = jurl + "job/" + jname + "/ws" + relativeImagePath + imageName;
						imageObj.imageUrl = wsImageUrl;
					}
					//save screen image
					fs.writeFile(path.resolve(screenShotPath, imageName), screenImg, {"encoding": "base64"}, function (err) {
						if (err) {
							deferred.reject(err);
						} else {
							deferred.fulfill(imageObj);
						}

					});
				}, function(err) {
					deferred.reject(err);
				});
				return deferred;
			},
			/**
			*	doneError - wraps "snap" and provides easy way to get a screenshot in the "rejected" callback 
			*					of a selenium-webdriver promise chain
			*	@param filename {String} - should be unique within the report directory and indicate which
			*								test it is associated with
			*	@param err {Error} - Error object thrown in the Promise chain. stack will be modified with image information
			*	@param done {Function} - mocha "done" function to call and end current test execution
			*/
			"doneError": function (filename, err, done) {
				this.snap(filename).
					then(function (imageObject) {
						var output = (imageObject.imageUrl) ? "\nnemo-screenshot\n" + imageObject.imageUrl + "\n" : "\nnemo-screenshot::" + JSON.stringify(imageObject) + "::nemo-screenshot";
						err.stack = err.stack + output;
						done(err);
					}, function(scerror) {
						console.log("nemo-screenshot encountered some error.", scerror.toString());
						done(err);
					});
			},
			/**
			*	done - wraps "snap" and provides easy way to get a screenshot in the "resolved" callback 
			*					of a selenium-webdriver promise chain
			*	@param filename {String} - should be unique within the report directory and indicate which
			*								test it is associated with
			*	@param done {Function} - mocha "done" function to call and end current test execution
			*/
			"done": function (filename, done) {
				this.snap(filename).
					then(function (imageObject) {
						var output = (imageObject.imageUrl) ? "\nnemo-screenshot\n" + imageObject.imageUrl + "\n" : "\nnemo-screenshot::" + JSON.stringify(imageObject) + "::nemo-screenshot";
						console.log(output);
						done();
					},function(scerr) {
						console.log("nemo-screenshot encountered some error.", scerr.toString());
						done();
					});
			}
		};
		callback(null);

	}
};