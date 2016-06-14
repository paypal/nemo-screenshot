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
var mkdirp = require('mkdirp');

function titleSlug(title) {
    if (!title) {
        return '';
    }

    return title.trim().replace(/\W/g, '_').substring(0, 251);
}

function appendImageUrlToStackSrace(imageObject, err) {
    var jenkinsImageUrls = imageObject.jenkinsImageUrls;
    var output;

    if (jenkinsImageUrls) {
        output = '\nnemo-screenshot (workspace): ' + jenkinsImageUrls.workspaceUrl + '\n' +
                 'nemo-screenshot (archived): ' + jenkinsImageUrls.archivedUrl + '\n';
    } else {
        output = '\nnemo-screenshot::' + JSON.stringify(imageObject) + '::nemo-screenshot';
    }

    if (err) {
        err.stack = err.stack + output;
    }
}

function formatJenkinsImageUrls(screenShotPath, imageName) {
    var jenkinsUrl = process.env.JENKINS_URL,
        buildUrl = process.env.BUILD_URL,
        jobName = process.env.JOB_NAME,
        workspace = process.env.WORKSPACE,
        relImagePath = screenShotPath.substr(workspace.length);

    var workspaceUrl = jenkinsUrl + 'job/' + jobName + '/ws' + relImagePath + '/' + imageName;
    var archivedUrl = buildUrl + 'artifact' + relImagePath + '/' + imageName;

    return {
        workspaceUrl: workspaceUrl,
        archivedUrl: archivedUrl
    };
}

module.exports = {
    /**
     *  setup - initialize this functionality during nemo.setup
     *  @param screenShotPath {Object} - fs path where screenshots should be saved
     *  @param nemo {Object} - nemo namespace
     *  @param callback {Function} - errback function
     */
    "setup": function (_screenShotPath, _autoCaptureOptions, _nemo, _callback) {

        var screenShotPath, autoCaptureOptions, nemo, callback, driver, flow;

        if (arguments.length === 3) {

            screenShotPath = arguments[0];
            nemo = arguments[1];
            callback = arguments[2];
            autoCaptureOptions = [];
        }

        else if (arguments.length === 4) {

            screenShotPath = arguments[0];
            autoCaptureOptions = arguments[1];
            nemo = arguments[2];
            callback = arguments[3];
        }

        driver = nemo.driver;
        flow = nemo.driver.controlFlow();
        nemo.screenshot = {
            /**
             *  snap - save a screenshot image as PNG to the "report" directory
             *  @param filename {String} - should be unique within the report directory and indicate which
             *                test it is associated with
             *  @returns {Promise} - upon successful completion, Promise will resolve to a JSON object as below.
             *              If Jenkins environment variables are found, jenkinsImageUrls will be added
             *              {
             *                  "imageName": "myImage.png",
             *                  "imagePath": "/path/to/image/"
             *                  [ "jenkinsImageUrls": { workspaceUrl: "jenkinsUrl", archivedUrl: "jenkinsUrl" } ]
             *              }
             */
            "snap": function (filename) {
                var deferred = nemo.wd.promise.defer(),
                    imageName,
                    imageObj = {"imageName": null, "imagePath": null};

                driver.takeScreenshot().then(function (screenImg) {
                    imageName = filename + ".png";

                    var imageDir = path.resolve(screenShotPath);
                    var imageFullPath = path.join(imageDir, imageName);

                    mkdirp.sync(imageDir);

                    imageObj.imageName = imageName;
                    imageObj.imagePath = imageFullPath;

                    //Jenkins stuff
                    if (process.env.JENKINS_URL) {
                        imageObj.jenkinsImageUrls = formatJenkinsImageUrls(screenShotPath, imageName);
                    }

                    //save screen image
                    fs.writeFile(imageFullPath, screenImg, {"encoding": "base64"}, function (err) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.fulfill(imageObj);
                        }

                    });
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred;
            },

            "done": function (filename, done, err) {
                this.snap(filename).
                    then(function (imageObject) {
                        appendImageUrlToStackSrace(imageObject, err);
                        done(err);
                    }, function (scerror) {
                        console.log("nemo-screenshot encountered some error.", scerror.toString());
                        done(scerror);
                    });
            },

            "setCurrentTestTitle": function(title) {
                this._currentTestTitle = title;
            }
        };

        //Adding event listeners to take automatic screenshot

        //Adding event listeners to take automatic screenshot
        if (autoCaptureOptions.indexOf('click') !== -1) {

            flow.on('scheduleTask', function (task) {
                driver.getSession().then(function (session) {
                    if (session && task !== undefined && task.indexOf('WebElement.click') !== -1) {
                        var filename = 'ScreenShot_onClick-' + process.pid + '-' + new Date().getTime();
                        flow.wait(function () {
                            return nemo.screenshot.snap(filename);
                        }, 10000);
                    }

                });
            });
        }

        if (autoCaptureOptions.indexOf('exception') !== -1) {
            flow.on('uncaughtException', function (exception) {
                if (exception._nemoScreenshotHandled) {
                    throw exception;
                }
                exception._nemoScreenshotHandled = true;
                driver.getSession().then(function (session) {
                    if (session) {
                        var filename;
                        var testTitle = nemo.screenshot._currentTestTitle;
                        if (testTitle) {
                            filename = titleSlug(testTitle);
                        }

                        if (!filename) {
                            filename = 'ScreenShot_onException-' + process.pid + '-' + new Date().getTime();
                        }

                        flow.wait(function () {
                            return nemo.screenshot.snap(filename).then(function (imageObject) {
                                appendImageUrlToStackSrace(imageObject, exception);
                                throw exception;
                            });
                        }, 10000);
                    } else {
                        throw exception;
                    }
                }).thenCatch(function(e) {
                    // Catch all exceptions to prevent an infnite uncaught exception loop
                    e._nemoScreenshotHandled = true;
                    throw e;
                });
            });
        }
        callback(null);
    }
};
