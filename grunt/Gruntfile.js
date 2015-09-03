/* =========================================================
 Grunt Starter Project
 ========================================================= */
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        banner: '/* -------------------------------------------------------- \n' +
        ' * \n' +
        ' *  <%= pkg.projectName %> - v<%= pkg.version %> \n' +
        ' *  Created by: <%= pkg.author.name %> \n' +
        ' * \n' +
        ' * -------------------------------------------------------- */',
        files:{
            styles:[]
        },

        // Clean the build folder before rebuild
        clean: {
            dist: {
                src: [ '../css/joe.css','../js/joe.js' ]
            }
        },

        // Writes custom banner
        usebanner: {
            fullBanner: {
                options: {
                    banner: '<%= banner %>',
                    linebreak: true
                },
                files: {
                    src: [ '../css/joe.css','../js/joe.js']
                }
            }
        },

        // Compile Sass/SCSS files
        'sass': {
            options: {
                precision: 4,
                sourceMap: true
            },
            dist: {
                options: {
                    outputStyle: 'expanded'
                },
                files: [{
                    expand: true,
                    cwd: '<%= folders.source %>',
                    src: ['**/*.scss'],
                    dest: '<%= folders.build %>',
                    ext: '.css'
                }]
            }
        },

        //
        uglify: {
            options: {
                mangle: false,
                beautify: false,
                compress: false,
                sourceMap: true
            },

            main: {
                files: {
                    '../js/joe.min.js': ['../js/joe.js']
                }
            }
        },


        concat: {
          options: {
            separator: ''
          },
          styles: {
            src: [
                "../css/leaflet.css",
                "../css/esri-leaflet-geocoder.css",
                "../css/jif/style.css",
                "../css/joe-styles.css",
                "../css/jquery-ui.min.css",
                "../css/variants/style-variant1.css"
            ],
            dest: '../css/joe.css'
          },
            scripts: {
                src: [
                    "../js/JsonObjectEditor.jquery.craydent.js",
                    "../js/leaflet.js",
                    "../js/esri-leaflet-geocoder.js",
                    "../js/zebra_datepicker.js"/*,
                    "../js/ace/ace.js"*/
                ],
                dest: '../js/joe.js'
            }
        },

        coverage: {
            default: {
                options: {
                    thresholds: {
                        'statements': 90,
                        'branches': 90,
                        'lines': 90,
                        'functions': 90
                    },
                    dir: 'coverage',
                    //root: 'test'
                }
            }
        },
        // Watches for changes to files
        watch: {
            options: {
                livereload: false,
                spawn: false
            },

            build_include: {
                files: ['../js/**/*.js','../css/**/*.css'],
                tasks: [ 'concat', 'usebanner' ,'uglify']
            }
        }

    });

    grunt.loadNpmTasks('grunt-istanbul-coverage');
    // Load Grunt Plugins
    require('load-grunt-tasks')(grunt);
    //grunt.loadNpmTasks('grunt-contrib-watch');
   // grunt.loadNpmTasks('grunt-contrib-concat');

    // Watch for changes
    grunt.registerTask('default', [ 'concat', 'usebanner', 'uglify',  'watch' ]);


};