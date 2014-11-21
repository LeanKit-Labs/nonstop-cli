var should = require( 'should' );

describe( 'Command parsing', function() {
	describe( 'when building without arguments', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns'.split( ' ' ) );
		} );

		it( 'should set option to build with no overwrite', function() {
			options.action.should.equal( 'build' );
			should( options.nopack ).not.exist; // jshint ignore: line
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when building with force', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns -f'.split( ' ' ) );
		} );

		it( 'should set option to build with no overwrite', function() {
			options.action.should.equal( 'build' );
			options.overwrite.should.be.true; // jshint ignore:line
		} );
	} );

	describe( 'when building specific project', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns --project test1'.split( ' ' ) );
		} );

		it( 'should set option to build specific project without overwrite', function() {
			options.action.should.equal( 'build' );
			options.project.should.equal( 'test1' );
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when building specific project with force', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns --project test1 -f'.split( ' ' ) );
		} );

		it( 'should set option to build specific project without overwrite', function() {
			options.action.should.equal( 'build' );
			options.project.should.equal( 'test1' );
			options.overwrite.should.be.true; // jshint ignore:line
		} );
	} );

	describe( 'when building without packaging', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns nopack'.split( ' ' ) );
		} );

		it( 'should set nopack without overwrite', function() {
			options.action.should.equal( 'build' );
			options.nopack.should.be.true; // jshint ignore: line
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when building specific project without packaging', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns nopack --project test2'.split( ' ' ) );
		} );

		it( 'should set nopack without overwrite for project', function() {
			options.action.should.equal( 'build' );
			options.nopack.should.be.true; // jshint ignore: line
			options.project.should.equal( 'test2' );
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when uploading all', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns upload'.split( ' ' ) );
		} );

		it( 'should set upload', function() {
			options.action.should.equal( 'upload' );
			should( options.package ).not.exist; // jshint ignore:line
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when uploading without specific package', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns upload'.split( ' ' ) );
		} );

		it( 'should set upload', function() {
			options.action.should.equal( 'upload' );
			options.packages.should.eql( [] ); // jshint ignore:line
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when uploading specific package', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns upload ./packages/blah.tar.gz'.split( ' ' ) );
		} );

		it( 'should set upload', function() {
			options.action.should.equal( 'upload' );
			options.packages.should.eql( [ './packages/blah.tar.gz' ] ); // jshint ignore:line
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );

	describe( 'when uploading multiple specific packages', function() {
		var options;

		before( function() {
			var prompt = require( '../src/prompt.js' );
			options = prompt.parse( 'node ns upload ./packages/blah.tar.gz ./packages/barf.tar.gz'.split( ' ' ) );
		} );

		it( 'should set upload', function() {
			options.action.should.equal( 'upload' );
			options.packages.should.eql( [ './packages/blah.tar.gz', './packages/barf.tar.gz' ] ); // jshint ignore:line
			options.overwrite.should.be.false; // jshint ignore:line
		} );
	} );
} );	