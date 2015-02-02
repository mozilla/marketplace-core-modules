var gulp = require('gulp');
var to5 = require('gulp-6to5');

gulp.task('6to5', function() {
    return gulp.src(['tests/*.js'])
        .pipe(to5({modules: 'amd'}))
        .pipe(gulp.dest('dist'));
});

gulp.task('test', function() {
    return gulp.watch(['tests/*.js'])
        .on('change', function(event) {
            gulp.src(event.path)
                .pipe(to5({modules: 'amd'}))
                .pipe(gulp.dest('dist'));
        });
});
