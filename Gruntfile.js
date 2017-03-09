
// Configuration for Node-RED-nodes project
module.exports = function(grunt) {
    grunt.initConfig({
        simplemocha: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'spec'
            },
            all: { src: ['test/*/*/*_spec.js'] },
        },
        jshint: {
            options: {
                jshintrc:".jshintrc",   // Use external file
            },
            all: {
                src: ['*/*.js','*/*/*.js'],
                filter: function(filepath) { // on some developer machines the test coverage HTML report utilities cause further failures
                    if ((filepath.indexOf("coverage/") !== -1) || (filepath.indexOf("node_modules") !== -1)) {
                        console.log( "\033[30m  filtered out \033[32m:\033[37m " + filepath + "\033[0m");
                        return false;
                    } else {
                        return true;
                    }
                }
            },
        },
        inlinelint: {
            html: ['*/*/*.html'],
            options: {
                jshintrc: ".jshintrc"
                //,reporter: require('jshint-stylish')
            }
        },
        jscs: {
            src: "*/*/*.js",
            options: {
                config: ".jscsrc",
                reporter: "inline"
                //,fix: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-lint-inline');
    grunt.loadNpmTasks('grunt-jscs');

    grunt.registerTask('default', ['jshint:all', 'inlinelint', 'simplemocha:all']);
    grunt.registerTask('style', ['jscs']);
};
