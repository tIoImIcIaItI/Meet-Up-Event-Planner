/// <binding BeforeBuild='default' AfterBuild='watch' Clean='clean' />
/*global module */

// PROJECT FOLDER STRUCTURE
//	root/
//		gruntfile.js
//		package.json
//		src/
//			css/
//			js/
//			img/ <== this is a target directory - do NOT put source files here - they go in /images/ !!!
//			*.html
//		dist/
//		images/

module.exports = function (grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		// Minify HTML files
		htmlmin: {
			dist: {
				options: {
					quoteCharacter: "'",
					minifyCSS: true,
					minifyJS: true,
					removeComments: true,
					collapseWhitespace: true,
					decodeEntities: true,
					html5: true
				},
				files: [{
					expand: true,
					cwd: 'src',
					src: '*.html',
					dest: 'dist'
				}]
			}
		},

		// Minify and join CSS files
		cssmin: {
			options: {
				sourceMap: true
			},
			dist: {
				files: {
					'dist/css/app.min.css': [
						'src/css/mixins.css',
						'src/css/md.css',
						'src/css/app.css'
					]
				}
			}
		},

		// Join JavaScipt files together in specific order
		concat: {
			options: {
				sourceMap: true
			},
			dist: {
				src: [
					'src/js/utils/arrays.js',
					'src/js/utils/objects.js',
					'src/js/utils/utils.js',
					'src/js/utils/deferred.js',
					'src/js/utils/observable.js',
					'src/js/views/widget.js',
					'src/js/views/loaderrorwidget.js',
					'src/js/views/saveerrorwidget.js',
					'src/js/views/emailaddresswidget.js',
					'src/js/views/passwordhelperwidget.js',
					'src/js/viewmodels/eventviewmodel.js',
					'src/js/eventrepository.js',
					'src/js/viewmodels/formviewmodel.js',
					'src/js/viewmodels/loginformviewmodel.js',
					'src/js/viewmodels/accountformviewmodel.js',
					'src/js/viewmodels/eventformviewmodel.js',
					'src/js/app.js',
					'src/js/init.js'
				],
				dest: 'dist/js/app.js'
			}
		},

		// Minify concatenated JS files
		uglify: {
			options: {
				sourceMap: true
			},
			dist: {
				files: {
					'dist/js/app.min.js': ['dist/js/app.js']
				}
			}
		},

		// Copy over files not otherwise relocated by other plug-ins
		copy: {

		},

		// Remove generated and copied files
		clean: {
			dist: [
				'dist/*.html',
				'dist/img/*',
				'dist/js/*',
				'dist/css/*'
			],
			staged_images: [
				'src/img/',
				'src/img/staging/'
			]
		},

		// Rebuild the project after any source file is changed
		watch: {
			files: 'src/**/*.*',
			tasks: ['default']
		}

	});


	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-watch');


	// The default task removes any prior build outputs,
	// processes images,
	// concatentates and minifies source files,
	// and copies any remaining content into the distribution folder.
	grunt.registerTask('default', [
		'clean',
		'htmlmin', 'cssmin', 'concat', 'uglify'
	]);

};
