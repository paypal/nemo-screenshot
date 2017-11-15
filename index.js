/*───────────────────────────────────────────────────────────────────────────*\
 │  Copyright (C) 2014 eBay Software Foundation                                │
 │                                                                             │
 │                                                                             │
 │   Licensed under the Apache License, Version 2.0 (the 'License'); you may   │
 │   not use this file except in compliance with the License. You may obtain   │
 │   a copy of the License at http://www.apache.org/licenses/LICENSE-2.0       │
 │                                                                             │
 │   Unless required by applicable law or agreed to in writing, software       │
 │   distributed under the License is distributed on an 'AS IS' BASIS,         │
 │   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  │
 │   See the License for the specific language governing permissions and       │
 │   limitations under the License.                                            │
 \*───────────────────────────────────────────────────────────────────────────*/
'use strict';
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

//native promise vs webdriver promise shim
function p(wd) {
    var promiz;
    var wdPromiz = wd.promise.defer();
    var fulfill = function (n) {
        wdPromiz.fulfill(n);
    };
    var reject = function (err) {
        wdPromiz.reject(err);
    };
    promiz = (global.Promise) ? new Promise(function (good, bad) {
        fulfill = good;
        reject = bad;
    }) : wdPromiz.promise;
    return {promise: promiz, fulfill, reject};
}

function titleSlug(title) {
    if (!title) {
        return '';
    }

    return title.trim().replace(/\W/g, '_').substring(0, 251);
}

function appendImageUrlToStackTrace(imageObject, err) {
    var output;

    if (imageObject.imageUrl || imageObject.archivedImageUrl) {
        output = '\n';
        if (imageObject.imageUrl) {
            output += 'nemo-screenshot (workspace): ' + imageObject.imageUrl + '\n';
        }

        if (imageObject.archivedImageUrl) {
            output += 'nemo-screenshot (archived): ' + imageObject.archivedImageUrl + '\n';
        }
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
        imageUrl, archivedImageUrl;

    if (!workspace) {
        console.log('nemo-screenshot was unable to format Jenkins image URLs: ' +
            'WORKSPACE env variable is not defined');
        return null;
    }

    var relImagePath = screenShotPath.substr(workspace.length);
    if (jobName) {
        imageUrl = jenkinsUrl + 'job/' + jobName + '/ws' + relImagePath + '/' + imageName;
    } else {
        console.log('nemo-screenshot was unable to format Jenkins workspace image URL: ' +
            'JOB_NAME env variable is not defined');
    }

    if (buildUrl) {
        archivedImageUrl = buildUrl + 'artifact' + relImagePath + '/' + imageName;
    }

    if (imageUrl || archivedImageUrl) {
        return {
            imageUrl: imageUrl,
            archivedImageUrl: archivedImageUrl
        };
    } else {
        return null;
    }
}


module.exports = {
    /**
     *  setup - initialize this functionality during nemo.setup
     *  @param screenShotPath {Object} - fs path where screenshots should be saved
     *  @param nemo {Object} - nemo namespace
     *  @param callback {Function} - errback function
     */
    'setup': function (_screenShotPath, _autoCaptureOptions, _nemo, _callback) {

        var screenShotPath, autoCaptureOptions, nemo, callback, driver, flow, scheduleTask, uncaughtException;

        if (arguments.length === 3) {
            screenShotPath = arguments[0];
            nemo = arguments[1];
            callback = arguments[2];
            autoCaptureOptions = [];

        } else if (arguments.length === 4) {
            screenShotPath = arguments[0];
            autoCaptureOptions = arguments[1];
            nemo = arguments[2];
            callback = arguments[3];
        }

        driver = nemo.driver;

        scheduleTask = nemo.wd.promise.ControlFlow.EventType.SCHEDULE_TASK;
        uncaughtException = nemo.wd.promise.ControlFlow.EventType.UNCAUGHT_EXCEPTION;
        flow = nemo.driver.controlFlow();

        nemo.screenshot = {
            /**
             *  snap - save a screenshot image as PNG to the 'report' directory
             *  @param filename {String} - should be unique within the report directory and indicate which
             *                             test it is associated with
             *  @returns {Promise} - upon successful completion, Promise will resolve to a JSON object as below.
             *                       If Jenkins environment variables are found, Jenkins image URLs will be added
             *                       {
             *                           'imageName': 'myImage.png',
             *                           'imagePath': '/path/to/image/'
             *                           [, 'imageUrl': 'jenkinsUrl', 'archivedImageUrl': 'jenkinsUrl' ]
             *                       }
             */
            'snap': function (filename) {
                var deferred = p(nemo.wd),
                    imageObj = {},
                    imageName;
                if (!driver.getSession()) {
                    //no valid session. no-op.
                    deferred.fulfill(true);
                    return deferred.promise;
                }
                driver.takeScreenshot().then(function (screenImg) {
                    imageName = filename + '.png';

                    var imageDir = path.resolve(screenShotPath);
                    var imageFullPath = path.join(imageDir, imageName);

                    // create directories all the way nested down to the last level
                    mkdirp.sync(path.dirname(imageFullPath));

                    imageObj.imageName = imageName;
                    imageObj.imagePath = imageFullPath;

                    // Jenkins stuff
                    if (process.env.JENKINS_URL) {
                        var imageUrls = formatJenkinsImageUrls(screenShotPath, imageName);
                        if (imageUrls) {
                            imageObj.imageUrl = imageUrls.imageUrl;
                            imageObj.archivedImageUrl = imageUrls.archivedImageUrl;
                        }
                    }

                    // save screen image
                    fs.writeFile(imageFullPath, screenImg, {
                        'encoding': 'base64'
                    }, function (err) {
                        if (err) {
                            deferred.reject(err);
                        } else {
                            deferred.fulfill(imageObj);
                        }
                    });
                }, function (err) {
                    deferred.reject(err);
                });

                return deferred.promise;
            },

            'done': function (filename, done, err) {
                this.snap(filename).then(function (imageObject) {
                    appendImageUrlToStackTrace(imageObject, err);
                    done(err);
                }, function (scerror) {
                    console.log('nemo-screenshot encountered some error.', scerror.toString());
                    done(scerror);
                });
            },

            'setCurrentTestTitle': function (title) {
                this._currentTestTitle = title;
            }
        };

        // Adding event listeners to take automatic screenshot
        if (autoCaptureOptions.indexOf('click') !== -1) {
            var oclick = nemo.wd.WebElement.prototype.click;
            nemo.wd.WebElement.prototype.click = function () {
                var filename = 'ScreenShot_onClick-' + process.pid + '-' + new Date().getTime();
                return nemo.screenshot.snap(filename)
                    .then(oclick.apply(this, arguments));
            };
        }

        if (autoCaptureOptions.indexOf('exception') !== -1) {
            flow.on(uncaughtException, function (exception) {
                if (exception._nemoScreenshotHandled) {
                    flow.emit(uncaughtException, exception);
                }

                exception._nemoScreenshotHandled = true;
                driver.getSession().then(function (session) {
                    if (session) {
                        var filename = 'ScreenShot_onException-' + process.pid + '-' + new Date().getTime();
                        var testTitle = nemo.screenshot._currentTestTitle;

                        if (testTitle) {
                            filename = titleSlug(testTitle);
                        }

                        nemo.screenshot.snap(filename).then(function (imageObject) {
                            appendImageUrlToStackTrace(imageObject, exception);
                            flow.emit(uncaughtException, exception);
                        });
                    } else {
                        throw exception;
                    }
                }).catch(function (e) {
                    e._nemoScreenshotHandled = true;
                    flow.emit(uncaughtException, exception);
                });
            });
        }

        callback(null);
    }
};
