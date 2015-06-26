module.exports = function(config) {
  config.set({
    browser: ['Chrome'],
    frameworks: ['jasmine'],
    reporters: ['html', 'default'],
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'src/valence.js',
      'src/**/*.js',
      'spec/**/*.js'
    ]
  })
};