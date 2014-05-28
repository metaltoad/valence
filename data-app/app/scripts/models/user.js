valence.model('user', {
  HTTP: {
    GET: { auth: true}
  },
  localize: false,
  normalize: function(data, q) {
    var def = q.defer(),
        obj = {};

    obj = data[0];

    def.resolve(obj);

    return def.promise;
  }
})