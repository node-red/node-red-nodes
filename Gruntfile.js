/**
 * Copyright 2013, 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(grunt) {
    function addAutoInstallSubdir(dir) {
        if(dir !== '') {
            var inst = grunt.config.get('auto_install') || {};
            inst[dir] = {
                options: {
                    cwd: dir,
                    failOnError: false
                }
            };                
            grunt.config.set('auto_install', inst);    
        }
    }

    grunt.registerTask('install_deps_recursive', 'Searches for all package.json and run "npm install"', function() {    
        grunt.file.expand({matchBase: true}, ['package.json', '!node_modules', '!**/node_modules/**']).forEach(function(dir) {
            dir = dir.substring(0, dir.lastIndexOf('/'));
            addAutoInstallSubdir(dir);
        });
        grunt.task.run('auto_install')
    });

    grunt.task.registerMultiTask('install_deps', 'Runs "npm install" for folders specified in install_deps.src', function() {
        if(this.target === 'src') {
            this.data.forEach(function(dir) {
                addAutoInstallSubdir(dir);
            });
            grunt.task.run('auto_install')
        }
    });

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mocha_istanbul: {
            options: {
                globals: ['expect'],
                timeout: 3000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'spec'
            },
            tests: {
                src: ['test/**/*_spec.js'],
                options: {
                    reportFormats: ['lcov'],
                    print: "detail"
                }
            },
            coveralls: {
                src: ['test/**/*_spec.js'],
                options: {
                    coverage: true,
                    reportFormats: ['lcovonly'],
                    print: "detail"
                }
            }
        },
        jshint: {
            options: {
                // http://www.jshint.com/docs/options/
                "asi": true,      // allow missing semicolons
                "curly": true,    // require braces
                "eqnull": true,   // ignore ==null
                "forin": true,    // require property filtering in "for in" loops
                "immed": true,    // require immediate functions to be wrapped in ( )
                "nonbsp": true,   // warn on unexpected whitespace breaking chars
                //"strict": true, // commented out for now as it causes 100s of warnings, but want to get there eventually
                "loopfunc": true, // allow functions to be defined in loops
                "sub": true       // don't warn that foo['bar'] should be written as foo.bar
            },
            tests: {
                files: {
                    src: ['test/**/*.js', '!**/node_modules/**/*.js']
                },
                options: {
                    "expr": true
                }
            },
            nodes: {
                files: {
                    src: [
                        '**/*.js',
                        '!test/**', 
                        '!coverage/**', 
                        '!node-red/**', 
                        '!**/node_modules/**'
                    ]
                }
            }                
        },
        auto_install: {},
        install_deps: {
            src: ['.node-red', 'utility/exif']
        }
    });
    
    grunt.event.on('coverage', function(lcov, done){
        require('coveralls').handleInput(lcov, function(err){
            // Skip coveralls errors
            // if (err) {
            //     return done(err);
            // }
            done();
        });
    });

    grunt.loadNpmTasks('grunt-mocha-istanbul');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-auto-install');

    grunt.registerTask('default', ['install_deps', 'jshint:nodes', 'jshint:tests', 'mocha_istanbul:tests']);
    grunt.registerTask('travis', ['install_deps', 'jshint:nodes', 'jshint:tests', 'mocha_istanbul:coveralls']);
    grunt.registerTask('test', ['jshint:tests', 'mocha_istanbul:tests']);
    grunt.registerTask('nodes', ['jshint:nodes']);
};
