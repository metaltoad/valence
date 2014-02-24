'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // configurable paths
  var yeomanConfig = {
    app: 'app',
    dist: 'dist'
  };

  try {
    yeomanConfig.app = require('./component.json').appPath || yeomanConfig.app;
  } catch (e) {}

  grunt.initConfig({
    yeoman: yeomanConfig,
    watch: {
      coffee: {
        files: ['<%= yeoman.app %>/scripts/{,*/}*.coffee'],
        tasks: ['coffee:dist']
      },
      compass: {
        files: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['compass']
      },
      livereload: {
        files: [
          '<%= yeoman.app %>/{,*/}*.html',
          '{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
          '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
          '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
        ],
        tasks: ['livereload']
      }
    },
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, '.tmp'),
              mountFolder(connect, yeomanConfig.app)
            ];
          }
        }
      },
      test: {
        options: {
          middleware: function (connect) {
            return [
              mountFolder(connect, '.tmp'),
              mountFolder(connect, 'test')
            ];
          }
        }
      }
    },
    open: {
      server: {
        url: 'http://localhost:<%= connect.options.port %>'
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      server: '.tmp'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        '<%= yeoman.app %>/scripts/{,*/}*.js'
      ]
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    compass: {
      options: {
        sassDir: '<%= yeoman.app %>/styles',
        cssDir: '.tmp/styles',
        imagesDir: '<%= yeoman.app %>/images',
        javascriptsDir: '<%= yeoman.app %>/scripts',
        fontsDir: '<%= yeoman.app %>/styles/fonts',
        importPath: '<%= yeoman.app %>/components',
        relativeAssets: true
      },
      dist: {},
      server: {
        options: {
          debugInfo: true
        }
      }
    },
    concat: {
      dist: {
        files: {
          '<%= yeoman.dist %>/scripts/scripts.js': [
            '.tmp/scripts/{,*/}*.js',
            '<%= yeoman.app %>/scripts/{,*/}*.js'
          ]
        }
      },
      bin: {
        files: {
          '<%= yeoman.app %>/bin/min/angular-data.min.js': [
            '<%= yeoman.app %>/bin/angular-data.js',
            '<%= yeoman.app %>/bin/angular-data-core.js',
            '<%= yeoman.app %>/bin/angular-data-model.js',
            '<%= yeoman.app %>/bin/angular-data-store.js',
            '<%= yeoman.app %>/bin/angular-data-loader.js',
            '<%= yeoman.app %>/bin/angular-data-cloud.js',
            '<%= yeoman.app %>/bin/angular-data-auth.js'
          ]
        }
      }
    },
    useminPrepare: {
      html: '<%= yeoman.app %>/index.html',
      options: {
        dest: '<%= yeoman.dist %>'
      }
    },
    usemin: {
      html: ['<%= yeoman.dist %>/{,*/}*.html'],
      css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= yeoman.dist %>']
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= yeoman.dist %>/images'
        }]
      }
    },
    cssmin: {
      dist: {
        files: {
          '<%= yeoman.dist %>/styles/main.css': [
            '.tmp/styles/{,*/}*.css',
            '<%= yeoman.app %>/styles/{,*/}*.css'
          ]
        }
      }
    },
    htmlmin: {
      dist: {
        options: {
          /*removeCommentsFromCDATA: true,
          // https://github.com/yeoman/grunt-usemin/issues/44
          //collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true*/
        },
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>',
          src: ['*.html', 'views/*.html'],
          dest: '<%= yeoman.dist %>'
        }]
      }
    },
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>/scripts',
          src: '*.js',
          dest: '<%= yeoman.dist %>/scripts'
        }]
      },
      bin: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/bin/min/',
          src: ['<%= yeoman.app %>/bin/min/anguar-data.min.js'],
          dest: '<%= yeoman.app %>/bin/min/anguar-data.min.js'
        }]
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= yeoman.dist %>/scripts/scripts.js': [
            '<%= yeoman.dist %>/scripts/scripts.js'
          ]
        }
      },
      bin: {
        options: {
          mangle:false,
          compress: {
            drop_console:true
          }
        },
        files: {
          '<%= yeoman.app %>/bin/min/angular-data.min.js': [
            '<%= yeoman.app %>/bin/angular-data.js',
            '<%= yeoman.app %>/bin/angular-data-core.js',
            '<%= yeoman.app %>/bin/angular-data-model.js',
            '<%= yeoman.app %>/bin/angular-data-store.js',
            '<%= yeoman.app %>/bin/angular-data-loader.js',
            '<%= yeoman.app %>/bin/angular-data-cloud.js',
            '<%= yeoman.app %>/bin/angular-data-auth.js'
          ]
        }
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= yeoman.dist %>/scripts/{,*/}*.js',
            '<%= yeoman.dist %>/styles/{,*/}*.css',
            '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= yeoman.dist %>/styles/fonts/*'
          ]
        }
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            '*.{ico,txt}',
            '.htaccess',
            'components/**/*',
            'images/{,*/}*.{gif,webp}',
            'styles/fonts/*'
          ]
        }]
      }
    },
    shell: {
      bin_dev: {
        options: {
          stdout: true
        },
        command: 'echo Copying app/bin to non-git location; cp -R app/bin ~/angular-data-tmp; echo Checking out master;'
                  // 'echo Checking out master; git checkout master; echo copying tmp files; cp -Rf ~/angular-data-tmp/ ./; echo Committing new files.' 
                  // //+ 'git add ./ && git commit; git pull; git push; echo Checking out Dev; git chcekout dev;'
      },
      bin_master: {
        options: {
          stdout:true
        },
        command: 'echo Copying tmp files to ./ on master; rm -rf data-app; rm -rf cloud-app; cp -Rf ~/angular-data-tmp/ ./'
      },
      bin_master_next: {
        options: {
          stdout:true
        }
      },
      command: 'pwd; cd data-app; npm install; bower install;'
    },
    gitcheckout: {
      master: {
        options: {
          branch: 'master'
        }
      },
      dev: {
        options: {
          branch: 'dev'
        }
      }
    },
    exec: {
      build: {
        cwd: '../',
        stdout: true,
        command: function(msg) {
          
          return 'pwd; echo Copying app/bin to non-git location; cp -R data-app/app/bin/ ~/valence-tmp; echo Checking out master; git checkout master;'+
                'echo Copying tmp files to ./ on master; rm -rf data-app; rm -rf cloud-app; cp -Rf ~/valence-tmp/ ./'
        }
      }
    }
  });

  grunt.renameTask('regarde', 'watch');

  grunt.loadNpmTasks('grunt-shell');

  grunt.loadNpmTasks('grunt-git');

  grunt.loadNpmTasks('grunt-exec');

  grunt.registerTask('server', [
    'clean:server',
    'compass:server',
    'livereload-start',
    'connect:livereload',
    'watch'
  ]);

  grunt.registerTask('test', [
    'clean:server',
    'compass',
    'connect:test',
    'karma'
  ]);

  grunt.registerTask('build', function() {
    var tasks = [];

    var defaultTasks = [
      'clean:dist',
      'jshint',
      'test',
      'compass:dist',
      'useminPrepare',
      'imagemin',
      'cssmin',
      'htmlmin',
      'concat',
      'copy',
      'cdnify',
      'ngmin',
      'uglify',
      'rev',
      'usemin'
    ];

    var masterTasks = [
      'uglify:bin',
      'exec:build'
    ];

    if(!arguments.length) {
      tasks = defaultTasks;
    } else {
      if(arguments[0] === 'master') {
        tasks = masterTasks;
      }
    }

    grunt.task.run(tasks);
  });

  grunt.registerTask('default', ['build']);
};