valenceAuth.role('admin', function(promise) {
  if(this.getIdentity().admin) {
    promise.resolve();
  } else {
    promise.reject();
  }
});
