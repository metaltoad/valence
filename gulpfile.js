'use strict';

/***********************************************************************************************************************************************
 * VALENCE GULP ENTRY
 ***********************************************************************************************************************************************
 * @description
 */

var gulp = require('gulp');
var karma = require('karma').server;
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var plumber = require('gulp-plumber');

gulp.task('tests', function(done) {
  return karma.start({
    configFile: __dirname+'/karma.conf.js'
  }, done);
});

gulp.task('tdd', function(done) {
  return karma.start({
    configFile: __dirname+'/karma.conf.js',
    singleRun: true
  }, done);
});

/**
 * Linter config.
 * @type {Object}
 */
var linter = {
  spec: {
    "node": true,
    "undef": false,
    "browser": true,
    "mocha": true,
    "globals": {
      "require": true,
      "console": true,
      "angular": true,
      "__dirname": true,
      "_": true,
      "config": true,
      "Identity": true
    }
  },
  src: 'src/**/*.js'
};

gulp.task('lint', function() {
  return gulp.src(linter.src)
    .pipe(plumber())
    .pipe(jshint(linter.spec))
    .pipe(jshint.reporter(stylish))
});

gulp.task('default', ['tests', 'lint']);