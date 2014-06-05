'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};


var envs = {
  dev: {
    api: 'http://localhost:9001',
    view_prefix: ""
  },
  prod: {
    api: 'http://54.187.93.210:3001',
    view_prefix: '/valence'
  }
};


envs.development = envs.dev;
envs.production = envs.prod;

var env;


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
          '<%= yeoman.app %>/bin/min/valence.min.js': [
            '<%= yeoman.app %>/bin/valence.js',
            '<%= yeoman.app %>/bin/valence-core.js',
            '<%= yeoman.app %>/bin/valence-model.js',
            '<%= yeoman.app %>/bin/valence-store.js',
            '<%= yeoman.app %>/bin/valence-loader.js',
            '<%= yeoman.app %>/bin/valence-cloud.js',
            '<%= yeoman.app %>/bin/valence-auth.js'
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
            'styles/fonts/*',
            'scripts/directives/templates/*'
          ]
        }]
      },
      env: {
        expand: true,
        dest: 'app/',
        src: 'env.js',
        options: {
          processContent: function(content, srcpath) {
              return content.replace(/_api_/g, ''+env.api+'');
          }
        }
      },
      view: {
        expand: true,
        flatten:true,
        dest: 'app/',
        src: 'app/env.js',
        options: {
          processContent: function(content, srcpath) {
              return content.replace(/_view_prefix_/g, ''+env.view_prefix+'');
          }
        }
      },
      deploy: {
        expand:true,
        flatten: true,
        dot:true,
        dest: '<%= yeoman.dist %>/',
        src: 'app/env.js'
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
      command: 'pwd; cd data-app; npm install; bower install;',
      deploy: {
        options: {
          stdout:true,
          stderr:true
        },
        command: 'cd ../ git add . && git commit -m "New Demo App Depoly" && git subtree push --prefix data-app/dist origin gh-pages'
      }
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

  grunt.registerTask('server', function() {
    var tasks = [
      'clean:server',
      'compass:server',
      'livereload-start',
      'connect:livereload',
      'watch'
    ];

    var env_tasks = 'copy:env';
    var view_tasks = 'copy:view';


    if(arguments.length) {

      env = envs[arguments[0]];
      console.log(env);

      tasks.unshift(env_tasks, view_tasks);

      grunt.task.run(tasks);
    } else {
      grunt.log.error('Please specify the target environment');
    }
  });

  grunt.registerTask('test', [
    'clean:server',
    'compass',
    'connect:test',
    'karma'
  ]);

  grunt.registerTask('release', function() {

    var tasks = [
      'uglify:bin',
      'exec:build'
    ];

    grunt.task.run(tasks);
  });

  grunt.registerTask('deploy', function() {
    var tasks = [
      'clean:dist',
      'compass:dist',
      'useminPrepare',
      'imagemin',
      'cssmin',
      'htmlmin',
      'concat',
      'copy',
      'ngmin',
      'uglify',
      'rev',
      'usemin',
      'copy:deploy'
    ];

    var env_tasks = 'copy:env';
    var view_tasks = 'copy:view';


    if(arguments.length) {

      env = envs[arguments[0]];

      tasks.unshift(env_tasks, view_tasks);

      if(arguments[0] === 'prod' || arguments[0] === 'production') {
        tasks.push('shell:deploy');
      }

      grunt.task.run(tasks);
    } else {
      grunt.log.error('Please specify the target environment');
    }
  });

  grunt.registerTask('default', ['build']);
};