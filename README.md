## nemo-screenshot

Nemo plugin which uses selenium-webdriver to take a screenshot

### Requirements

* Assumes use of grunt-loop-mocha v0.2.6 or higher

### Usage

1. Add this to your package.json
2. Add this to your nemo-plugins.json


```javascript
"nemo-screenshot": "0.1.2",
```

3. Replace error "done" function body as follows

```javascript
it('should locate bank elements @locateBankElements@', function (done) {
	view.wallet.getBankElements().
		then(function () {
			done()
		}, function (err) {
			setup.screenshot.doneError("locateBankElement", err, done);
		});
});
```