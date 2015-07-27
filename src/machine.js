var _ = require( 'lodash' );
var when = require( 'when' );
var machina = require( 'machina' );
var debug = require( 'debug' )( 'nonstop:cli' );

module.exports = function( workingPath, prompt, build, index ) {
	var Machine = machina.Fsm.extend( {

		raiseAny: function( step ) {
			return function( err, result ) {
				var ev = step + '.' + ( err ? 'failed' : 'done' );
				this.handle( ev, err || result );
			}.bind( this );
		},

		raiseResult: function( step ) {
			return function( result ) {
				this.handle( step + '.done', result );
			}.bind( this );
		},

		initialState: 'initializing',
		states: {
			initializing: {
				_onEnter: function() {
					debug( 'looking for a build file' );
					build.hasBuildFile( workingPath )
						.then( function( result ) {
							this.hasBuildFile = result;
							if ( result ) {
								debug( 'build file found' );
								this.transition( 'checkingParameters' );
							} else {
								debug( 'no file found :(' );
								this.transition( 'createBuild' );
							}
						}.bind( this ) )
						.then( null, function( err ) {
							prompt.error( 'Invalid working directory - "' + workingPath + '"', err );
						} );
				}
			},
			checkingParameters: {
				_onEnter: function() {
					this.options = prompt.parse();
					debug( 'transitioning to %s', this.options.action );
					this.transition( this.options.action );
				}
			},
			createBuild: {
				_onEnter: function() {
					prompt.create( this.raiseResult( 'define' ) );
				},
				'define.done': function( info ) {
					this.info = info;
					prompt.format( this.raiseResult( 'format' ) );
				},
				'format.done': function( format ) {
					build.saveFile( './.nonstop.' + format, this.info, format );
				}
			},
			build: {
				_onEnter: function() {
					console.log( 'Starting build' );
					build.start( workingPath, this.options.project, this.options.nopack, this.options.verbose )
						.then( function( info ) {
							this.handle( 'build.done', info );
						}.bind( this ) )
						.then( null, function( err ) {
							this.handle( 'build.failed', err );
						}.bind( this ) );
				},
				'build.done': function( info ) {
					var onNoPackage;
					if ( this.options.nopack ) {
						console.log( '*** nopack specified: no packages were created ***' );
						onNoPackage = 'nopack specified.';
					}
					console.log( 'Completed build of ' + info.length + ' package(s):' );
					_.map( info, function( i ) {
						var projectName = i.value.name.split( '~' )[ 0 ];
						if ( !i.value.failed ) {
							var project = i.value;
							if ( project.files ) {
								console.log( '    ' + projectName + ' - "' + project.output + '" => ' + project.files.length + ' files.' );
							} else {
								console.log( '    ' + projectName + ' - ' + ( onNoPackage || 'no files matched pattern: "' + project.pattern + '"' ) );
							}
						} else {
							console.log( '    ' + projectName + ' - ' + i.value.error );
						}
					} );
				},
				'build.failed': function( err ) {
					console.log( err );
				}
			},
			upload: {
				_onEnter: function() {
					this.address = this.options.address;
					this.port = this.options.port;
					this.token = this.options.token;
					if ( !_.isEmpty( this.options.packages ) ) {
						this.handle( 'packages.done', this.options.packages );
					} else if( this.options.latest ) {
						this.options.latest
							.then( this.raiseResult( 'packages' ) );
					} else {
						prompt.pick( this.raiseResult( 'packages' ) );
					}
				},
				'packages.failed': function( x ) {
					console.log( x.stack );
				},
				'packages.done': function( selections ) {
					this.selections = selections;
					if ( this.selections.length > 0 ) {
						debug( 'packages selected for upload: %', selections );
						if( !this.address || !this.token || !this.port ) {
							prompt.server( this.raiseResult( 'server' ) );
						} else {
							this.address = this.options.address;
							this.handle( 'server.done', this );
						}
					} else {
						console.log( 'No packages selected for upload' );
					}
				},
				'token.done': function( auth ) {
					this.handle( 'upload', { token: auth.token } );
				},
				'server.done': function( server ) {
					debug( 'server information: %s', server );
					this.address = server.address;
					this.port = server.port;
					if( !this.token ) {
						debug( 'asking user for token' );
						prompt.token( this.raiseResult( 'token' ) );
					} else {
						this.handle( 'upload', { token: this.token } );
					}
				},
				upload: function( options ) {
					try {
						var client = index( {
							index: {
								host: this.address,
								port: this.port,
								token: options.token
							}
						} );
						var promises = _.map( this.selections, function( pkg ) {
							return client.upload( pkg );
						} );
						when.all( promises )
							.then( function() {
								console.log( 'Upload(s) complete' );
							} )
							.then( null, function( err ) {
								console.log( 'Upload(s) failed with', err );
							} );
					} catch (e) {
						console.log( ':(', e );
					}
				}
			},
			prompt: {
				_onEnter: function() {
					try {
						prompt.initiate( this.raiseResult( 'prompt' ) );
					} catch (e) {
						console.log( e.stack );
					}
				},
				'prompt.done': function( choice ) {
					var nextState = prompt.lookup[ choice.initialization ];
					this.transition( nextState );
				}
			}
		}
	} );
	return new Machine();
};
