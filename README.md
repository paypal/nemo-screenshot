## nemo-screenshot

Nemo plugin which uses selenium-webdriver to take a screenshot

Register as "screenshot" (see below)

[![Build Status](https://travis-ci.org/paypal/nemo-screenshot.svg?branch=master)](https://travis-ci.org/paypal/nemo-screenshot)

### Requirements

* Lists `nemo@^1.0.4` as a peerDependency

### Usage

* `npm install --save-dev nemo-screenshot@^v1.0.0`
* Add this to your Nemo plugins configuration (adjust `arguments` according to where you want screenshots to be saved):

```javascript
plugins: {
  screenshot: {
    module: 'nemo-screenshot',
    arguments: [reportPath {String}[, eventArray {Array}]]
  },
  /* other plugins */
},
driver: {
  // driver props
}
```

The plugin takes as argument the path to save the screenshots and an optional `eventsArray`. The events array can have one or more of the following elements.

* `"click"`   - Takes a screenshot everytime the user performs a click
* `"exception"` - Takes a screenshot when an exception occurs

### API

#### screenshot.snap

* `@argument filename {String}` will save `<report directory>/filename.png` to the filesystem
* `@returns {Promise}` resolves to a JSON object:

```javascript
{
  "imageName": "myImage.png",
  "imagePath": "/path/to/image/"
  // this will be included optionally if Jenkins environment variables are present
  // "imageUrl": "jenkinsURL",
  // "archivedImageUrl": "jenkinsURL"
}
```

#### screenshot.done

This is a convenience wrapper around `screenshot.snap` which can accept a callback, e.g. a mocha `done` method

* `@argument filename {String}` will save `<report directory>/filename.png` to the filesystem
* `@argument done {Function}` errback function to execute after screenshot is saved (or if there is an error saving screenshot)
* `@argument err {Error} (optional)` error associated with screenshot. image information will be attached to this error's stack trace for reporting purposes

Usage example:

```javascript
  it('will do some stuff then take a screenshot', function (done) {
    nemo.somePlugin.someAction().then(function() {
      // success!
      nemo.screenshot.done('success', done);
    }, function (err) {
      // failure!
      nemo.screenshot.done('success', done, err);
    });
  });
```

#### screenshot.setCurrentTestTitle

If set, the test title will be used as the screenshot filename when an exception occurs. Default screenshot filename is `ScreenShot_onException-[process_id]-[timestamp].png`, which is not easy to identify the failing test case.

* `@argument testTitle {String}` current test title
