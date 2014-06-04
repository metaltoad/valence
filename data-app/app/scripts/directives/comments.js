/***********************************************************************************************************************************************
 * COMMMENTS DIRECTIVE
 ***********************************************************************************************************************************************
 * @description
 */
app.directive('comments', function($parse, $compile) {
  return {
    restrict: 'A',
    scope: {comments: '='},
    templateUrl: 'views/comments.html',
    replace: false,
    transclude: true,
    controller: function($scope, $element, $attrs, valence) {

      

      $scope.showReply = false;

      $scope.submitReply = function(comment, reply) {

        var data = {};

        data.post_id = comment.post_id;
        data.comment_id = comment._id;
        data.body = reply;

        valence.post('comments', {data: data}).then(function(data) {
          console.log(data);
        });
      }


    },
    compile: function(tElement, tAttr, transclude) {

      var contents = tElement.contents().remove();
      var compiledContents;

      return function(scope, iElement, iAttr) {
        if(!compiledContents) {
          //Get the link function with the contents frome top level template with 
          //the transclude
          compiledContents = $compile(contents, transclude);
        }
        //Call the link function to link the given scope and
        //a Clone Attach Function, http://docs.angularjs.org/api/ng.$compile :
        // "Calling the linking function returns the element of the template. 
        //    It is either the original element passed in, 
        //    or the clone of the element if the cloneAttachFn is provided."
        compiledContents(scope, function(clone, scope) {
          //Appending the cloned template to the instance element, "iElement", 
          //on which the directive is to used.
          iElement.append(clone); 
        });
      };


      // $scope.loadReplies = function(model, idx) {
      //   $scope.model = [];

      //   $scope.model.push(model)

      //   var wrapper = $element[0].querySelectorAll('.comment-wrapper')[idx];
      //   var replies = wrapper.querySelector('.replies');
      //   var html;

      //   if(replies && !replies.children.length) {
      //     // console.log(model);
      //     html = document.createElement('div');
      //     html.setAttribute('comments', 'model');
      //     replies.appendChild(html);
      //     $compile(angular.element(replies).contents())($scope);
      //   }

      //   console.log($scope.model);
      // }
    }
  }
})