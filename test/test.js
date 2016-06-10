'use strict';

var Nemo = require('nemo');
var nemo;
var assert = require('assert');
var fs = require('fs');
var glob = require('glob');
var rm = require('rimraf');
var path = require('path');
var basedir = __dirname;
var config = {
    plugins: {
        screenshot: {
            module: 'path:../index',
            arguments: ['path:report', ['exception']]
        }
    },
    driver: {
        browser: 'phantomjs'
    }
};
var cleaner = function (cb) {
    rm(path.resolve(__dirname, 'report'), {}, function (err) {
        if (err) {
            return cb(err);
        }
        cb();
    })
};
describe('nemo-screenshot', function () {
    before(function (done) {
        cleaner(function (err) {
            if (err) {
                return done(err);
            }
            nemo = Nemo(basedir, config, function (err) {
                if (err) {
                    done(err);
                } else {
                    done();
                }
            });
        })


    });
    //afterEach(function (done) {
    //    nemo.driver.getSession().then(function (session) {
    //        if (!session) {
    //            nemo.driver.quit().then(function () {
    //                done();
    //            }, function () {
    //                done();
    //            });
    //        } else {
    //            done();
    //        }
    //
    //    })
    //
    //
    //});

    it('will get @setup@', function (done) {
        assert(nemo.screenshot);
        done();
    });
    it('will use @snap@ to take a screenshot', function (done) {
        nemo.driver.get('http://www.google.com');
        nemo.screenshot.snap('goog').then(function () {
            //verify file exists
            assert(fs.statSync(path.resolve(__dirname, 'report/goog.png')));
            done();
        });

    });
    it('will use @done@ to take a screenshot', function (done) {
        nemo.screenshot.done('goog', function fakeDone() {
            assert(fs.statSync(path.resolve(__dirname, 'report/goog.png')));
            done();
        });
    });
    // not sure how to test this as an uncaughtException ALWAYS fails a mocha test
    // it('will take a screenshot for an uncaughtException event', function (done) {
    //     nemo.driver.get('http://www.google.com');
    //     nemo.driver.findElement(nemo.wd.By.name('sfsfq')).sendKeys('foobar');
    //     nemo.driver.sleep(1).then(function () {
    //         console.log('foo')
    //     }, function (err) {
    //         done();
    //     }).thenCatch(function (err) {
    //         done();
    //     });
    // });

    it('will use @done@error@ to take a screenshot in an error scenario', function (done) {
        nemo.screenshot.done('goog', function fakeDone(err) {
            assert(err.stack.indexOf('nemo-screenshot') !== -1);
            assert(fs.statSync(path.resolve(__dirname, 'report/goog.png')));
            done();
        }, new Error('my error'));
    });

    it('will match @Event@ type enumerations to regular strings', function (done) {
      //This test is not exactly testing nemo-screenshot functionality, However,
      //in future if new version of WebDriverJS changes object structure of enumerations below, this test will fail
      //and that will prevent us from breaking this package
      var scheduleTask = nemo.wd.promise.ControlFlow.EventType.SCHEDULE_TASK,
        uncaughtException = nemo.wd.promise.ControlFlow.EventType.UNCAUGHT_EXCEPTION;
      assert.equal(scheduleTask == 'scheduleTask', true);
      assert.equal(uncaughtException == 'uncaughtException', true);
      done();
    });

});
