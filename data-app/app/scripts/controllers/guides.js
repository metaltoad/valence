app.controller('GuidesCtrl', function($scope, $rootScope, $sce) {
	console.log($sce.isEnabled());
	$scope.title = 'First Steps';

	var videoUrl = 'http://foo.com/'+$scope.title.toLowerCase().replace(/ /gi, "-");
	$scope.videoUrl = $sce.trustAsResourceUrl(videoUrl);


	$scope.showVideo = function(evt) {
		$scope.title = evt.target.textContent;
		$scope.videoUrl = 'http://foo.com/'+$scope.title.toLowerCase().replace(/ /gi, "-");
	};
});