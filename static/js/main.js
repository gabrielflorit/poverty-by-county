$(function() {

	var $projects = $('.projects');

	var projectsResize = function() {

		// get the size of container
		var width = $projects.width();
		$('img.iphone', $projects)
			.width(317*width/1500);
		$('img.ipad', $projects).width(1024*width/1500);

	};
	projectsResize();

	$(window).resize(function() {
		projectsResize();
	});

	$('img.lazy').jail();

});