'use strict';

var app = angular.module('valenceApp', ['ngRoute', 'valence', 'valenceAuth']);

app.config(function ($routeProvider, valenceProvider, valenceAuthProvider) {
    
  // NG DATA CONFIG
  valenceProvider.api = 'http://localhost:9001';

  valenceProvider.loader = {
    loader: '#loader',
    content: '#transition-wrapper'
  };
  
  valenceProvider.storageEngine = {primary: 'localStorage', fallbackToMemory: true};

  valenceAuthProvider.dataStore = window.valence.store;

  valenceAuthProvider.endpoints = {
    login: {
      URL: 'http://localhost:9001/session',
      requires: ['username', 'password'],
      method: 'POST',
      sucess: '/'
    },
    logout: {
      URL: 'http://localhost:9001/session',
      method: 'DELETE',
      success : '/'
    },
    validate: {
      URL: 'http://localhost:9001/session',
      method: 'GET'
    },
    new: {
      URL: 'http://localhost:9001/user',
      method: 'POST',
      success: '/',
      validateOnNew: true
    }
  };

  valenceAuthProvider.session = {
    headers: {
      withCredentials: true,
    }
  };

  // valenceAuthProvider.authEvery = true;

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
          auth: {
            success: '/'
          }
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
      model: ['posts', 'authors']
    })
    .when('/blog/new', {
      templateUrl: 'views/post/new.html',
      controller: 'PostCtrl',
      auth: true,
      redirect: {
        auth: {
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
        enabled: true,
        roles: ['admin', 'author'],
        redirect: {
          auth: {
            fail: '/login'
          },
          roles: {
            fail: '/blog'
          }
        }
      }
    })
    .when('/authors/:author_id', {
      templateUrl: 'views/authors.html',
      controller: 'AuthorsCtrl',
      model: 'authors'
    })
    .when('/contact', {
      templateUrl: 'views/contact.html',
      controller: 'ContactCtrl',
    })
    .otherwise({
      redirectTo: '/'
    });
  });

app.run(function($route, valence) {
  
}); 
