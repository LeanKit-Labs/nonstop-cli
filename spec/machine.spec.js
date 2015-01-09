var should = require( 'should' ); // jshint ignore:line
var when = require( 'when' );
var sinon = require( 'sinon' );
var machineFn = require( '../src/machine.js' );
var noop = function() {};

// mock shells
var prompt = { 
	create: noop,
	error: noop,
	parse: noop,
	pick: noop,
	server: noop,
	token: noop
};
var build = { 
	hasBuildFile: noop,
	start: noop
};

var index = {
	init: noop
};

var client = {
	upload: noop
};

describe( 'when build invoked with invalid working path', function() {
	var machine, promptMock;
	var err = new Error( 'noper' );

	before( function( done ) {
		sinon.stub( build, 'hasBuildFile' )
			.returns( when( err ) );
		promptMock = sinon.mock( prompt );
		promptMock.expects( 'error' ).once().withExactArgs( 'Invalid working directory - "./lol/jk/"', err );
		machine = machineFn( './lol/jk/', prompt, build, index );
		done();
	} );

	it( 'should report the error', function() {
		promptMock.verify();
	} );

	after( function() {
		promptMock.restore();
		build.hasBuildFile.restore();
	} );
} );

describe( 'when build invoked without valid build file in working path', function() {
	var machine, promptMock;

	before( function( done ) {
		sinon.stub( build, 'hasBuildFile' )
			.returns( when( false ) );
		promptMock = sinon.mock( prompt );
		promptMock.expects( 'create' ).once();
		machine = machineFn( './lol/jk/', prompt, build, index );
		done();
	} );

	it( 'should call prompt create', function() {
		promptMock.verify();
	} );

	after( function() {
		promptMock.restore();
		build.hasBuildFile.restore();
	} );
} );

describe( 'when build invoked with valid file and no arguments', function() {
	var machine, promptMock, buildMock;

	before( function( done ) {
		buildMock = sinon.mock( build );
		buildMock.expects( 'start' )
			.withArgs( './spec/project/', undefined, false )
			.once()
			.returns( when.resolve( [ { value: { name: 'test', files: [ 1, 2, 3 ], output: 'pretend.tar.gz' } } ] ) );
		buildMock.expects( 'hasBuildFile' )
			.once()
			.returns( when( [ { value: { name: 'test' } } ] ) );
		promptMock = sinon.mock( prompt );
		promptMock.expects( 'parse' ).once().returns( { action: 'build', nopack: false } );
		machine = machineFn( './spec/project/', prompt, build, index );
		done();
	} );

	it( 'should get args from prompt', function() {
		promptMock.verify();
	} );

	it( 'should call build start', function() {
		buildMock.verify();
	} );

	after( function() {
		buildMock.restore();
		promptMock.restore();
	} );
} );

describe( 'when build invoked with valid file and nopack', function() {
	var machine, promptMock, buildMock;

	before( function( done ) {
		buildMock = sinon.mock( build );
		buildMock.expects( 'start' )
			.withArgs( './spec/project/', undefined, true )
			.once()
			.returns( when.resolve( [] ) );
		buildMock.expects( 'hasBuildFile' )
			.once()
			.returns( when( true ) );
		promptMock = sinon.mock( prompt );
		promptMock.expects( 'parse' ).once().returns( { action: 'build', nopack: true } );
		machine = machineFn( './spec/project/', prompt, build, index );
		done();
	} );

	it( 'should get args from prompt', function() {
		promptMock.verify();
	} );

	it( 'should call build start', function() {
		buildMock.verify();
	} );

	after( function() {
		buildMock.restore();
		promptMock.restore();
	} );
} );

describe( 'when uploading from a pick list', function() {

	var machine, promptMock, indexMock, clientMock, buildMock;

	before( function( done ) {
		buildMock = sinon.mock( build );
		buildMock.expects( 'start' ).once();
		buildMock.expects( 'hasBuildFile' ).once().returns( when( true ) );

		clientMock = sinon.mock( client );
		clientMock
			.expects( 'upload' )
			.once()
			.withArgs( 'a~b~c~d~e~f~g~h~i.tar.gz' )
			.returns( when(true ) );

		indexMock = sinon.mock( index );
		indexMock
			.expects( 'init' )
			.once()
			.withArgs(
				{ index: 
					{
						host: 'localhost',
						port: 12345,
						token: 'ohhai'
					}
				} )
			.returns( client );

		promptMock = sinon.mock( prompt );
		promptMock
			.expects( 'pick' )
			.once()
			.onFirstCall()
			.callsArgWith( 0, [ 'a~b~c~d~e~f~g~h~i.tar.gz' ] );
		promptMock
			.expects( 'server' )
			.once()
			.callsArgWith( 0, { address: 'localhost', port: 12345 } );
		promptMock
			.expects( 'token' )
			.once()
			.callsArgWith( 0, { token: 'ohhai' } );
		promptMock
			.expects( 'parse' )
		 	.once()
		 	.returns( { action: 'upload' } );
		machine = machineFn( './spec/project/', prompt, build, index.init );
		done();
	} );

	it( 'should upload the file correctly', function() {
		clientMock.verify();
	} );

	after( function() {
		buildMock.restore();
		promptMock.restore();
		indexMock.restore();
		clientMock.restore();
	} );
} );

describe( 'when uploading from command line', function() {

	var machine, promptMock, indexMock, clientMock, buildMock;

	before( function( done ) {
		buildMock = sinon.mock( build );
		buildMock.expects( 'start' ).once();
		buildMock.expects( 'hasBuildFile' ).once().returns( when( true ) );

		clientMock = sinon.mock( client );
		clientMock
			.expects( 'upload' )
			.once()
			.withArgs( 'a~b~c~d~e~f~g~h~i.tar.gz' )
			.returns( when(true ) );

		indexMock = sinon.mock( index );
		indexMock
			.expects( 'init' )
			.once()
			.withArgs(
				{ index: 
					{
						host: 'localhost',
						port: 12345,
						token: 'ohhai'
					}
				} )
			.returns( client );

		promptMock = sinon.mock( prompt );
		promptMock
			.expects( 'server' )
			.once()
			.callsArgWith( 0, { address: 'localhost', port: 12345 } );
		promptMock
			.expects( 'token' )
			.once()
			.callsArgWith( 0, { token: 'ohhai' } );
		promptMock
			.expects( 'parse' )
		 	.once()
		 	.returns( { action: 'upload', packages: [ 'a~b~c~d~e~f~g~h~i.tar.gz' ] } );
		machine = machineFn( './spec/project/', prompt, build, index.init );
		done();
	} );

	it( 'should upload the file correctly', function() {
		clientMock.verify();
	} );

	after( function() {
		buildMock.restore();
		promptMock.restore();
		indexMock.restore();
		clientMock.restore();
	} );
} );