/* eslint-disable import/no-extraneous-dependencies */
import { src, dest, watch, series, parallel } from 'gulp';
import browserSync from 'browser-sync';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';
import postcss from 'gulp-postcss';
import postcssImport from 'postcss-import';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import terser from 'gulp-terser';
import { deleteAsync } from 'del';

const bs = browserSync.create();
const sass = gulpSass(dartSass);

/* ---------- chemins ---------- */
const paths = {
  scss:   'src/scss/**/*.scss',
  js:     'src/js/**/*.js',
  html:   'src/html/**/*.html',
  images: 'src/images/**/*.{jpg,jpeg,png,svg,gif}',
  dist:   'dist'
};

/* ---------- tâches ---------- */
export function styles() {
  return src(paths.scss, { sourcemaps: true })
    .pipe(sass.sync({ outputStyle: 'expanded' }).on('error', sass.logError))
    .pipe(
      postcss([
        postcssImport,
        autoprefixer,
        cssnano()                       // minification CSS (sourcemap conservé)
      ])
    )
    .pipe(dest(`${paths.dist}/css`, { sourcemaps: '.' }))
    .pipe(bs.stream());
}

export function scripts() {
  return src(paths.js, { sourcemaps: true })
    .pipe(terser())                     // minification JS maison
    .pipe(dest(`${paths.dist}/js`, { sourcemaps: '.' }))
    .pipe(bs.stream());
}

/* --- NEW --- copie GSAP & ScrollTrigger depuis node_modules */
export function vendor() {
  return src([
    'node_modules/gsap/dist/gsap.min.js',
    'node_modules/gsap/dist/ScrollTrigger.min.js'
  ]).pipe(dest(`${paths.dist}/js/vendor`));
}

export function html() {
  return src(paths.html).pipe(dest(paths.dist)).pipe(bs.stream());
}

export function images() {
  return src(paths.images)
    .pipe(
      imagemin([
        mozjpeg({ quality: 80, progressive: true }),
        pngquant({ quality: [0.7, 0.9] }),
        imagemin.svgo({ plugins: [{ removeViewBox: false }] })
      ])
    )
    .pipe(dest(`${paths.dist}/images`));
}

export const clean = () => deleteAsync([paths.dist]);

/* ---------- serveur & watch ---------- */
function serve() {
  bs.init({ server: { baseDir: paths.dist }, open: true });
  watch(paths.scss, styles);
  watch(paths.js, scripts);
  watch(paths.html, html);
  watch(paths.images, images);
  /* pas de watch sur vendor() : GSAP ne change jamais */
}

/* ---------- exports Gulp ---------- */
export const build = series(
  clean,
  parallel(styles, scripts, vendor, html, images)    // vendor inclus
);

export default series(build, serve);                 // `gulp` ou `npm run dev`
