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
var mkdirRecursive = function (dirPath, mode) {
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
   *  setup - initialize this functionality during nemo.setup
   *  @param screenShotPath {Object} - fs path where screenshots should be saved
   *  @param nemo {Object} - nemo namespace
   *  @param callback {Function} - errback function
   */

   



  "setup": function (config, nemo, callback) {
    
    var screenShotPath,autoCaptureOptions;

    if(typeof(config) == 'string'){
      screenShotPath = config;
      autoCaptureOptions = [];
    }else{
      screenShotPath = config.screenShotPath;
      autoCaptureOptions = config.autoCaptureOptions || [];
    }
    var driver = nemo.driver;
    nemo.screenshot = {
      /**
       *  snap - save a screenshot image as PNG to the "report" directory
       *  @param filename {String} - should be unique within the report directory and indicate which
       *                test it is associated with
       *  @returns {Promise} - upon successful completion, Promise will resolve to a JSON object as below.
       *              If Jenkins environment variables are found, imageUrl will be added
       *              {
      *               "imageName": "myImage.png", 
      *               "imagePath": "/path/to/image/"
      *               [, "imageUrl": "jenkinsURL"]
      *             }
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
              wsImageUrl = jurl + "job/" + jname + "/ws" + relativeImagePath + "/" + imageName;
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
        }, function (err) {
          deferred.reject(err);
        });
        return deferred;
      },

      "done": function (filename, done, err) {
        this.snap(filename).
          then(function (imageObject) {
            var output = (imageObject.imageUrl) ? "\nnemo-screenshot\n" + imageObject.imageUrl + "\n" : "\nnemo-screenshot::" + JSON.stringify(imageObject) + "::nemo-screenshot";
            if (err) {
              err.stack = err.stack + output;
            }
            done(err);
          }, function (scerror) {
            console.log("nemo-screenshot encountered some error.", scerror.toString());
            done(scerror);
          });
      }
    };

    //Adding event listeners to take automatic screenshot

    if(autoCaptureOptions.indexOf('click') != -1){
      
      nemo.driver.flow_.on('scheduleTask',function(task){
        if(task != undefined){
          if(task.indexOf('WebElement.')!= -1){
            var app = task.split('.');
            if(app[1].indexOf('click')!= -1){
              var path = screenShotPath;
              var filename = 'ScreenShot-' + process.pid + '-' + new Date().getTime();
              var screenShotFileName = path + '\\' + filename;
              nemo.screenshot.snap(screenShotFileName);
            }
          }
        }
      });

    }

    if(autoCaptureOptions.indexOf('exception') != -1){

      nemo.driver.flow_.on('uncaughtException',function(exception){
        var path = screenShotPath;
        var filename = 'ScreenShot-' + process.pid + '-' + new Date().getTime();
        var screenShotFileName = path + '\\' + filename;
        nemo.screenshot.snap(screenShotFileName).then(function(){
        });
        throw exception;
      });

    }

    callback(null);

  }
};