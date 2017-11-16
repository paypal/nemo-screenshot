# nemo-screenshot changelog

## v3.0.2

* modify exception handler pattern to use the ControlFlow `emit` method. fix unit test for the same

## v3.0.1

* resolve newer webdriver promise syntax and conditionally use native promises if available. fixes #61 
* no-op "snap" if no valid session. fixes #60

## v3.0.0-alpha

* add peerDependency for nemo >=2

## v2.2.4 
* simpler implementation of click screenshot that monkey patches WebElement.click

## v2.2.3

* added a check in click event listener to prevent exception when driver.getSession() returns undefined value. See https://github.com/paypal/nemo-screenshot/pull/57

## v2.2.2

* fix silenced uncaught exception due to selenium-webdriver bug. See https://github.com/paypal/nemo-screenshot/pull/54

## v2.2.1

* fix screenshot creation logic. See https://github.com/paypal/nemo-screenshot/pull/52

## v2.2.0

* fix Jenkins image URLs and add new archivedImageUrl. See https://github.com/paypal/nemo-screenshot/pull/49

## v2.1.0

* upgrade versions of dev dependencies. jshintrc changes. update license. please see: https://github.com/paypal/nemo-screenshot/pull/37
* feature: `setCurrentTestTitle` feature. please see: https://github.com/paypal/nemo-screenshot/pull/42
* bugfix: fix exception loop. please see: https://github.com/paypal/nemo-screenshot/issues/43

## v2.0.1

* fix: mocha tests hanging when auto exception screenshot is enabled (see: https://github.com/paypal/nemo-screenshot/pull/35)

## v2.0.0

* Use nemo@^2.0 for dep/peerdep
