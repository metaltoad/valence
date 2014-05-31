valence.role('admin', function(valence, q) {
  var def = q.defer();

  valence.acl.getIdentity().then(function(identity) {
    if(identity.role && identity.role === 'admin') {
      def.resolve();
    } else {
      def.reject();
    }
  })

  return def.promise;
});
