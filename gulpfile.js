var gulp = require('gulp'),
	gutil = require('gulp-util'),
	livereload = require('gulp-livereload');

gulp.task('default', ['staticsvr'], function() {
	livereload.listen();
	gulp.watch('logic/*.js', ['reload']);
	gulp.watch('style/*.css', ['reload']);
	gulp.watch('index.html', ['reload']);
});

gulp.task('reload', function() {
	gulp.src('./').pipe(livereload());
});

gulp.task('staticsvr', function (next) {
	var staticS = require('node-static'),
		server = new staticS.Server('./'),
		port = 8080;

	require('http').createServer(function (request, response) {
		request.addListener('end', function () {
			server.serve(request, response);
		}).resume();
	}).listen(port, function() {
		gutil.log('Server listening on port: ' + gutil.colors.magenta(port));
		next();
	});
});