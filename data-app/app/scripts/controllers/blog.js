app.controller('BlogCtrl', function ($scope, $location, valence) {

  valence.scope('posts', $scope);

  $scope.posts = [];

  $scope.predicate = '-created';

  $scope.excerpt = function(text) {
    if(text) {
      return text.slice(0, 250) + '...';
    }
  };

  $scope.formatDate = function(date) {
  	var toDate = new Date(date*1000);

  	var day = (function(date) {
  		var self;

  		var dayMap = {
  			0: 'Sunday',
  			1: 'Monday',
  			2: 'Tuesday',
  			3: 'Wednesday',
  			4: 'Thursday',
  			5: 'Friday',
  			6: 'Saturday'
  		};

  		return dayMap[date.getDay()];

  	})(toDate)

		var hours = toDate.getHours();

		var minutes = toDate.getMinutes();

		return day + ',' +hours + ':' + minutes;
  };
});
