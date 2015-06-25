describe('Valence Cache', function() {
  var valence, httpbackend, cache, timeout, rootScope;

  beforeEach(module('Valence'));

  beforeEach(inject(function(Valence, $httpBackend, $injector, $timeout, $rootScope) {
    valence = Valence;
    httpbackend = $httpBackend;
    timeout = $timeout;
    rootScope = $rootScope;

    cache = $injector.get('Valence.Cache');
  }));

  beforeEach(function(done) {
    window.jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;

    setTimeout(function() {
      done();
    }, 500);
  });

  it('Should add some data to the cache', function(done) {
    var url = 'http://foo.com/1',
        instance = cache(url);

      instance.set(url, {name: 'John', age: '31'}).then(function(data) {
        expect(data).toBeDefined();
        expect(data.age).toBe('31');
        done();
      }, function(err) {
        throw new Error('Could not set data to cache: '+err);
      });

    rootScope.$digest();
  });

  it('Should return the cached data set, with a set expiry(5000)', function(done) {
    var url = 'http://foo.com/1',
        instance = cache(url, {expires: 5000});

    instance.set(url, {name: 'John', age: '31'}).then(function(data) {
      instance.get(url).then(function(data) {
        expect(data).toBeDefined();
        done();
      }, function(err) {
        console.log(err);
        throw new Error('Could not retrieve cached item: '+err);
      });
    }, function(err) {
      throw new Error('Could not set data to cache: '+err);
    });

    rootScope.$digest();
  });

  it('Should return the cached items if called multiple times before the expiry', function(done) {
    var url = 'http://foo.com/1',
        instance = cache(url, {expires: 15000}),
        interval = 1500,
        intervals = 5,
        executed = 0;

    instance.set(url, {name: 'John', age: '31'}).then(function(data) {
      loop();
    }, function(err) {
      throw new Error('Could not set data to cache: '+err);
    });

    function loop() {

      instance.get(url).then(function() {
        executed++;

        if(executed < intervals) {
          setTimeout(function() {
            loop();
          }, interval);
        } else {
          done();
        }
      }, function(err) {
        throw new Error('Could not retrieve cached item: '+err);
      });

      setTimeout(function() {
        rootScope.$digest();
      }, 0);
    }

    rootScope.$digest();
  });

  it('Should fail to retrieve cached items if the expiry has arrived', function(done) {
    var url = 'http://foo.com/1',
        instance = cache(url, {expires: 5000});

    instance.set(url, {name: 'John', age: '31'}).then(function(data) {
      loop();
    }, function(err) {
      throw new Error('Could not set data to cache: '+err);
    });

    function loop() {
      instance.get(url).then(function() {
        setTimeout(function() {
          loop();
        }, 6000);
      }, function(err) {
        expect(err).toBeDefined();
        done();
      });

      setTimeout(function() {
        rootScope.$digest();
      }, 0);
    }

    rootScope.$digest();
  });
});