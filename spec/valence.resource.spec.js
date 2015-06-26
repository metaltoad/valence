'use strict';

/***********************************************************************************************************************************************
 * VALENCE RESOURCE TEST
 ***********************************************************************************************************************************************
 * @description
 */

describe('Valence Resource', function() {
  var valence, httpbackend;

  beforeEach(module('Valence'));

  beforeEach(inject(function(Valence, $httpBackend) {
    valence = Valence;
    httpbackend = $httpBackend;
  }));

  it('GET - Should respond with a user.', function(done) {
    var spec = {url: 'http://api.valence.com/users', cache: {expires: 0}},
        resource = new valence.Resource('Users', spec);

    httpbackend.expectGET(spec.url).respond(200, [{name: 'Jon', lastname: 'Doe'}]);

    resource.get().then(function(data) {
      expect(data.length).toBeGreaterThan(0);
    }).finally(done);

    httpbackend.flush();
  });

  it('Dynamic URL segments should be replaced by correct values', function(done) {
    var spec = {url: 'http://api.valence.com/users/:uid/permissions/:permid', cache: {expires: 0}},
        resource = new valence.Resource('User', spec),
        url;

    url = resource.url(spec.url).segments({uid: 6, permid: 24623452345});

    expect(url).toBe('http://api.valence.com/users/6/permissions/24623452345');
    done();
  });

  it('Dynamic URL segments should be replaced by correct values even if repeated', function(done) {
    var spec = {url: 'http://api.valence.com/users/:uid/users/:uid', cache: {expires: 0}},
      resource = new valence.Resource('User', spec),
      url;

    url = resource.url(spec.url).segments({uid: 6, permid: 24623452345});

    expect(url).toBe('http://api.valence.com/users/6/users/6');
    done();
  });
});