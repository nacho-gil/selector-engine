'use strict';

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: '.jshintrc',
            },
            allFiles: ['Gruntfile.js', 'selector.js']
        },
        uglify: {
            options: {
                preserveComments: 'some'
            },
            target: {
                files: {
                    'selector.min.js': ['selector.js']
                }
            }
        },
        // Karma Unit tests
        karma: {
            tests: {
                configFile: 'test/karma.conf.js'
            }
        }
    });

    // Load grunt tasks from npm packages
    require('load-grunt-tasks')(grunt);

    // Run karma to unit test
    grunt.registerTask('test', ['karma']);

    // By default, lint and uglify
    grunt.registerTask('default', ['jshint', 'uglify']);
};
