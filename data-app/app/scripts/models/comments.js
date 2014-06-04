valence.model('comments', {
  HTTP: {
    GET: {url: 'comments', params: {post_id: 'post_id'}},
    POST: {url: 'comments', data: {post_id: 'post_id'}}
  },
  belongsTo: {
  	model: 'post',
  	type: Array,
  	by: {post_id: 'post_id'}
  },
  normalize: function(valence, args, data, q) {
    var def = q.defer(),
        idx = 0;

    // Outer
    (function outer() {
      if(data[idx] && data[idx].comment_id) {
        // Inner
        (function inner(arr, obj) {
          for(var i=0; i<arr.length;i++) {
            // First do one off check
            if(obj && arr[i]._id === obj.comment_id) {
              if(!arr[i].comments) {
                arr[i].comments = [];   
              }

              arr[i].comments.push(obj);

              data.splice(idx, 1);
              outer();
            } else {
              if(arr[i].comments && arr[i].comments.length) {
                inner(arr[i].comments, obj);
              }
            }
          }
        })(data, data[idx], idx);
      } else {
        if(data[idx+1]) {
          idx++;
          outer();
        } else {
          def.resolve(data);
        }
      }
    })();

    return def.promise;
  },
  type: Array
});