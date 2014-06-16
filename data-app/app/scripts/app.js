'use strict';

var app = angular.module('valenceDemoApp', ['ngRoute', 'valence']);

app.config(function ($routeProvider, valenceProvider, $sceProvider) {
  
  // Disable sce
  $sceProvider.enabled(false);
  
  // NG DATA CONFIG
  valenceProvider.api = api;

  
  valenceProvider.loader.loader = '#loader',
  valenceProvider.loader.content = '#transition-wrapper',
  valenceProvider.loader.enabled = true
  
  
  valenceProvider.storageEngine = {primary: 'memory', fallbackToMemory: true};

  valenceProvider.acl.identity.model = 'user';

  valenceProvider.auth.endpoints = {
    login: {
      URL: api+'/session',
      requires: ['username', 'password'],
      method: 'POST',
      success: '/'
    },
    logout: {
      URL: api+'/session',
      method: 'DELETE',
      success : '/'
    },
    validate: {
      URL: api+'/session',
      method: 'GET',
      name: 'token'
    }
  };

  valenceProvider.auth.enabled = true;

  $routeProvider
    .when('/', {
      templateUrl: 'views/main.html',
      controller: 'MainCtrl',
      auth: false
    })
    .when('/login', {
      templateUrl: 'views/login.html',
      controller: 'LoginCtrl',
      auth: {
        redirect: {
          success: '/'
        }
      }
    })
    .when('/sign-up', {
      templateUrl: 'views/sign-up.html',
      controller: 'SignUpCtrl',
      auth: false
    })
    .when('/blog', {
      templateUrl: 'views/blog.html',
      controller: 'BlogCtrl',
      model: ['posts']
    })
    .when('/blog/new', {
      templateUrl: 'views/post/new.html',
      controller: 'PostCtrl',
      auth: {
        redirect: {
          fail: '/login'
        }
      }
    })
    .when('/blog/:post_id', {
      templateUrl: 'views/post.html',
      controller: 'PostCtrl',
      model: ['post'],
      auth: false
    })
    .when('/blog/:post_id/edit', {
      templateUrl: 'views/post/edit.html',
      controller: 'PostCtrl',
      model: 'post',
      auth: {
        redirect: {
          fail: '/login'
        }
      },
      access: {
        roles: ['admin', 'author'],
        redirect: {
          fail: 'previous'
        }
      }
    })
    .when('/authors/:author_id', {
      templateUrl: 'views/authors.html',
      controller: 'AuthorsCtrl',
      model: ['authors', 'author_posts']
    })
    .when('/guides', {
      templateUrl: 'views/guides.html',
      controller: 'GuidesCtrl',
    })
    .when('/docs', {
      templateUrl: 'views/docs.html',
      controller: 'DocsCtrl',
    })
    .when('/slides', {
      templateUrl: 'views/slide.html',
      controller: 'SlideCtrl'
    })
    .when('/slides/:slide', {
      templateUrl: 'views/slide.html',
      controller: 'SlideCtrl'
    })
    .when('/404', {
      templateUrl: 'views/404.html',
      controller: 'MainCtrl'
    })
    .when('/500', {
      templateUrl: 'views/500.html',
      controller: 'MainCtrl'
    })
    .otherwise({
      redirectTo: '/404'
    });
  });

app.run(function($route, valence) {}); 
