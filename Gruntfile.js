
// Configuration for Node-RED-nodes project
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        simplemocha: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'spec'
            },
            all: { src: ['test/*/*/*_spec.js'] }
        },
        jshint: {
            options: {
                jshintrc:true     // Use external jshinrc file configured as below
                // http://www.jshint.com/docs/options/
                //"asi": true,      // allow missing semicolons
                //"curly": true,    // require braces
                //"eqnull": true,   // ignore ==null
                //"forin": true,    // require property filtering in "for in" loops
                //"immed": true,    // require immediate functions to be wrapped in ( )
                //"nonbsp": true,   // warn on unexpected whitespace breaking chars
                ////"strict": true, // commented out for now as it causes 100s of warnings, but want to get there eventually
                //"loopfunc": true, // allow functions to be defined in loops
                //"sub": true       // don't warn that foo['bar'] should be written as foo.bar
            },
            all: {
                src: ['*/*/*.js'],
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
            html: ['*/*/*.html', '!node_modules/*/*.html', '!*/node_modules/*.html'],
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

    grunt.registerTask('default', ['jshint:all', 'inlinelint:html', 'simplemocha:all']);
    grunt.registerTask('style', ['jscs']);
};
