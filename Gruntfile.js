/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    eslint: {
      target: ['src/**/*.js'],
      options: {
        config: '.eslintrc'
      }
    },
    jscs: {
        src: ['src/**/*.js'],
        options: {
            config: '.jscsrc'
        }
    },
    'ftp-deploy': {
      build: {
        auth: {
          host: 'ftp.pcextreme.nl',
          port: 21,
          authKey: 'gloey.nl'
        },
        src: 'www',
        dest: '/domains/gloey.nl/htdocs/www/apps/scrollview.js'
      }
    },
    exec: {
      clean: 'rm -rf ./www',
      'build-debug': 'webpack --debug --devtool sourcemap --output-pathinfo',
      'build-min': 'webpack --devtool sourcemap --optimize-minimize',
      'build-demo': 'webpack --d --demo',
      'serve': 'webpack-dev-server -d --inline --reload=localhost --demo',
      'open-serve': 'open http://localhost:8080',
      test: 'mocha'
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-jscs');
  grunt.loadNpmTasks('grunt-ftp-deploy');
  grunt.loadNpmTasks('grunt-exec');

  // Default task.
  grunt.registerTask('default', ['lint', 'exec:build']);
  grunt.registerTask('build', ['exec:build-debug', 'exec:build-min']);
  grunt.registerTask('build-demo', ['exec:build-demo']);
  grunt.registerTask('lint', ['eslint'/*, 'jscs'*/]);
  grunt.registerTask('clean', ['exec:clean']);
  grunt.registerTask('test', ['exec:test']);
  grunt.registerTask('serve', ['exec:open-serve', 'exec:serve']);
  grunt.registerTask('deploy', ['lint', 'exec:clean', 'exec:build-debug', 'ftp-deploy']);
};
