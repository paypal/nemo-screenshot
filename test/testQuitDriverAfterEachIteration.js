'use strict';

var Nemo = require('nemo');
var nemo;
var rm = require('rimraf');
var path = require('path');
var basedir = __dirname;
var config = {
    plugins: {
        screenshot: {
            module: 'path:../index',
            arguments: ['path:report', ['exception', 'click']]
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
    });
};
describe('nemo-screenshot-quit-driver-for-each-iteration', function () {
    beforeEach(function (done) {
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
        });


    });
    afterEach(function () {
        return nemo.driver.quit();
    });


    for (var i=0; i<3; i++){
        it('will test quit driver after each iteration for multiple iterations, iteration number:' + i, function (done) {
            done();
        });
    }


});
