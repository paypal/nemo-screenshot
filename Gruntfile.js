'use strict';

module.exports = function(grunt) {
	grunt.initConfig({
		simplemocha: {
			options: {
				globals: ['should'],
				timeout: 3000,
				ignoreLeaks: false,
				grep: '',
				ui: 'bdd',
				reporter: 'spec'
			},

			all: {
				src: ['test/*.js']
			}
		},
		jshint: {
			files: ['index.js', 'Gruntfile.js'],
			options: {
				jshintrc: true
			}
		}
	});

	// For this to work, you need to have run `npm install grunt-simple-mocha`
	grunt.loadNpmTasks('grunt-simple-mocha');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	// Add a default task. This is optional, of course :)
	grunt.registerTask('default', ['simplemocha', 'jshint']);
	// Add a default task. This is optional, of course :)
};
