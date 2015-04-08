'use strict';

var Nemo = require('nemo');
var nemo;
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var basedir = __dirname;
var config = {
  plugins: {
    screenshot: {
      module: 'path:../index',
      arguments: ['path:report']
    }
  },
  driver: {
    browser: 'phantomjs'
  }
};
var cleaner = function (cb) {
  fs.unlink(path.resolve(__dirname, 'report/goog.png'), function (err) {
    //ignore errors
    fs.rmdir(path.resolve(__dirname, 'report'), function (err) {
      //ignore errors
      cb();
    })
  });
};
describe('nemo-screenshot', function () {
  before(function (done) {
    cleaner(function () {
      nemo = Nemo(basedir, config, function (err) {
        if (err) {
          done(err);
        }
        done();
      });
    })


  });
  after(function (done) {
      nemo.driver.quit().then(function () {
        done();
    });

  });
  afterEach(function (done) {
    cleaner(function () {
      done();
    });

  });
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
  it('will use @done@ to take a screenshot', function(done) {
     nemo.screenshot.done('goog', function fakeDone() {
       assert(fs.statSync(path.resolve(__dirname, 'report/goog.png')));
       done();
     });
  });
  it('will use @doneError@ to take a screenshot', function(done) {
    nemo.screenshot.doneError('goog', new Error('my error'), function fakeDone(err) {
      assert(err.stack.indexOf('nemo-screenshot') !== -1);
      assert(fs.statSync(path.resolve(__dirname, 'report/goog.png')));
      done();
    });
  });
});