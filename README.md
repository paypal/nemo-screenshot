## nemo-screenshot

Nemo plugin which uses selenium-webdriver to take a screenshot

Register as "screenshot" (see below)

[![Build Status](https://travis-ci.org/paypal/nemo-screenshot.svg?branch=master)](https://travis-ci.org/paypal/nemo-screenshot)

### Requirements

* Assumes use of grunt-loop-mocha v0.2.6 or higher

### Usage

* Add this to your package.json
* Add this to your nemo-plugins.json
```javascript
{
	"plugins": {
		"screenshot": {
			"module": "nemo-screenshot",
			"register": true
		}
	}
}
```

```javascript
"nemo-screenshot": "^0.1.0",
```

* Replace error "done" function body as follows

```javascript
it('should locate bank elements @locateBankElements@', function (done) {
	nemo.view.wallet.getBankElements().
		then(function () {
			done()
		}, function (err) {
			nemo.screenshot.doneError("locateBankElement", err, done);
		});
});
```

Usage of other screenshot methods is similar

### API

#### screenshot.snap

```javascript
/**
*	snap - save a screenshot image as PNG to the "report" directory
*	@param filename {String} - should be unique within the report directory and indicate which
*								test it is associated with
*	@returns {Promise} - upon successful completion, Promise will resolve to a JSON object as below.
*							
*/
```

#### screenshot.done

```javascript
/**
*	done - wraps "snap" and provides easy way to get a screenshot in the "resolved" callback 
*					of a selenium-webdriver promise chain
*	@param filename {String} - should be unique within the report directory and indicate which
*								test it is associated with
*	@param done {Function} - mocha "done" function to call and end current test execution
*/
```

#### screenshot.doneError

```javascript
/**
*	doneError - wraps "snap" and provides easy way to get a screenshot in the "rejected" callback 
*					of a selenium-webdriver promise chain
*	@param filename {String} - should be unique within the report directory and indicate which
*								test it is associated with
*	@param err {Error} - Error object thrown in the Promise chain. stack will be modified with image information
*	@param done {Function} - mocha "done" function to call and end current test execution
*/
```
