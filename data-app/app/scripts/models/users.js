valence.model('users', {
  localize:false,
  normalize: function(data, args, q) {
    var def = q.defer(),
      obj = data;

    if(args.action === "POST") {
      obj = data[0]
    }

    def.resolve(obj);
    return def.promise;
  }
})