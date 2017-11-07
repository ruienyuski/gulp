var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');
var gulpSequence = require('gulp-sequence');

//等於production時有壓縮
var envOptions = {
  string: 'env',
  default: { env: 'develop' }
}
var options = minimist(process.argv.slice(2), envOptions)
console.log(options)

//gulp-clean 清理輸出的最終資料夾,保持資料夾(.tmp public)在最新狀態,輸入gulp clean
gulp.task('clean', function () {
  return gulp.src(['./.tmp','./public'] ,{ read: false })
    .pipe($.clean());
});


gulp.task('copyHTML', function () {
  return gulp.src('./source/**/*.html')
    .pipe(gulp.dest('./public/'))
})

//HTML 樣板語言
gulp.task('jade', function () {
  // var YOUR_LOCALS = {};

  gulp.src('./source/**/*.jade')
    .pipe($.plumber())//即使出錯程式仍然繼續跑
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('./public/'))
    .pipe(browserSync.stream());//寫網頁有修改時會自動更新預覽頁面
});

//sass
gulp.task('sass', function () {
  var plugins = [
    autoprefixer({ browsers: ['last 3 version', '> 5%', 'ie 8'] })
  ];

  return gulp.src('./source/scss/**/*.scss')
    .pipe($.plumber())//即使出錯程式仍然繼續跑
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    //編譯完成css
    .pipe($.postcss(plugins))
    .pipe($.if(options.env === 'production', $.minifyCss()))//CSS 壓縮工具,等於production時有壓縮
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/css'))
    .pipe(browserSync.stream());//寫網頁有修改時會自動更新預覽頁面    
});

gulp.task('babel', () => {
  gulp.src('./source/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === 'production', $.uglify({
      compress: {
        drop_console: true
      }
    })))//JavaScript 壓縮工具,compress 把console測試行為移除,等於production時有壓縮
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./public/js'))
    .pipe(browserSync.stream());//寫網頁有修改時會自動更新預覽頁面 
});

//bower 管理安裝的套件
gulp.task('bower', function () {
  return gulp.src(mainBowerFiles())
    .pipe(gulp.dest('./.tmp/vendors'))
});

//bower 將下載的套件與public串接
gulp.task('vendorJs', ['bower'], function () {//需跑完bower才跑verdorJs
  return gulp.src('./.tmp/vendors/**/**.js')
    .pipe($.concat('vendors.js'))
    .pipe($.if(options.env === 'production', $.uglify()))//JavaScript 壓縮工具,等於production時有壓縮
    .pipe(gulp.dest('./public/js'))
})

gulp.task('browser-sync', function () {
  browserSync.init({
    server: {
      baseDir: "./public"
    }
  });
});

//壓縮圖片
gulp.task('image-min', () =>
gulp.src('./source/images/*')
    .pipe($.if(options.env === 'production', $.imagemin()))//JavaScript 壓縮工具,等於production時有壓縮
    .pipe(gulp.dest('./public/images'))
);

//sass watch監控資料夾
gulp.task('watch', function () {
  gulp.watch('./source/scss/**/*.scss', ['sass']);
  gulp.watch('./source/**/*.jade', ['jade']);
  gulp.watch('./source/js/**/*.js', ['babel']);
});

//gulp-gh-pages 上傳到github
gulp.task('deploy', function() {
  return gulp.src('./public/**/*')
    .pipe($.ghPages());
});


//完成專案用gulp build --env production為最終輸出
gulp.task('build',gulpSequence('clean','jade', 'sass', 'babel', 'vendorJs','image-min'));//這6項流程為發佈用,所以不需要'browser-sync', 'watch'這兩個開發流程

//開發階段為gulp
gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'browser-sync','image-min', 'watch']);