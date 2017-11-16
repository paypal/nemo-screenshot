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
var cleaner = function () {
    let pFunk;
    let p = new Promise((resolve, reject) => {
        pFunk = {resolve, reject};
    });
    rm(path.resolve(__dirname, 'report'), {}, function (err) {
        if (err) {
            return pFunk.reject(err);
        }
        pFunk.resolve(true)
    });
    return p;
};
describe('nemo-screenshot', function () {
    before(function () {
        return cleaner().then(() => {
            return Nemo(basedir, config)
        }).then((n) => {
            nemo = n;
            return true;
        });
    })


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

    it('will take a screenshot for an uncaughtException event', function (done) {
        function unExList(ex) {
            console.log(ex);
            nemo.driver.controlFlow().removeListener('uncaughtException', unExList);
            done();
        }

        nemo.driver.get('http://www.google.com');
        nemo.driver.findElement(nemo.wd.By.name('sfsfq')).sendKeys('foobar');
        nemo.driver.controlFlow().on('uncaughtException', unExList);
    });
    it('will use @done@error@ to take a screenshot in an error scenario', function (done) {
        nemo.screenshot.done('goog', function fakeDone(err) {
            assert(err.stack.indexOf('nemo-screenshot') !== -1);
            assert(fs.statSync(path.resolve(__dirname, 'report/goog.png')));
            done();
        }, new Error('my error'));
    });


})
;
