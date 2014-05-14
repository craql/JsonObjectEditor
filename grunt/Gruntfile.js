/* =========================================================
    Grunt Deployment Process for Tools
    
    Last Modified: April 23, 2015
========================================================= */

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({    
    pkg: grunt.file.readJSON('package.json'),
    
    projects: {
      // Tools folder on CDN
      remote: '/var/www/tools',
      Local: '',
      Server: 'JOE',
      Command: 'joe'
    },

    rsync: {
      options: {
        args: ["--verbose"],
        exclude: [".git*","*.scss","node_modules","grunt"],
        recursive: true,
        syncDestIgnoreExcl: true
      },
    
      // IconLicensing Project
      DEV: {
        options: {
          src: "<%= projects.Local %>/",
          dest: "<%= projects.remote %>/<%= projects.Server %>/",
          host: "corey@webapps-cdn-dev.esri.com",
        }
      },
      STG: {
        options: {
          src: "<%= projects.Local %>",
          dest: "<%= projects.remote %>/<%= projects.Server %>/",
          host: "corey@webapps-cdn-stg.esri.com",
        }
      },
      PRD: {
        options: {
          src: "<%= projects.Local %>/",
          dest: "<%= projects.remote %>/<%= projects.Server %>/",
          host: "corey@webapps-cdn.esri.com",
        }
      }
} 

      
  });
  
  // CDN Deploy Grunt Plugins
  grunt.loadNpmTasks('grunt-rsync');
  require('load-grunt-tasks')(grunt);
  
  
  // Push Form Creator
  grunt.registerTask( 'sync-<%= projects.Command %>-dev', [ 'rsync:DEV' ] );
  grunt.registerTask( 'sync-joe-stg', [ 'rsync:STG' ] );
  grunt.registerTask( 'sync-<%= projects.Command %>-prd', [ 'rsync:PRD' ] );
  
  
  
};


