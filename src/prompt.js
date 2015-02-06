var _ = require( 'lodash' );
var inquire = require( 'inquirer' );
var path = require( 'path' );
var fs = require( 'fs' );
var packagePath = path.resolve( path.dirname( module.filename ), '../package.json' );
var version = require( packagePath ).version;
var pack = require( 'nonstop-pack' );
var settings = process.env.HOME ? path.join( process.env.HOME, '.nonstop' ) : path.join( process.env.HOMEDRIVE, process.env.HOMEPATH, '.nonstop' );
var glob = require( 'globulesce' );
var keys = require( 'when/keys' );

function remember( key, val ) {
	var exists = fs.existsSync( settings );
	var json = exists ? JSON.parse( fs.readFileSync( settings ) ) : {};
	if ( !val && !exists ) {
		return undefined;
	}
	if ( !val ) {
		return json[ key ];
	} else {
		json[ key ] = val;
		fs.writeFileSync( settings, JSON.stringify( json ) );
	}
}

var authChoices = {
	token: 'Auth token',
	credentials: 'Credentials (user & password)'
};
var authLookup = {};
_.each( authChoices, function( val, key ) {
	authLookup[ val ] = key;
} );

function addArgument( step, cb ) { // jshint ignore: line
	inquire.prompt( [
		{
			type: 'input',
			name: 'arg',
			message: 'command: "' + step.command + " " + _.map( step.arguments ).join( ' ' ) + '"\nAdd an argument (empty string for no args)', // jshint ignore: line
		}
	], function( r ) {
			if ( _.isEmpty( r.arg ) ) {
				cb( step );
			} else {
				step.arguments.push( r.arg.trim() );
				addArgument( step, cb );
			}
		} );
}

function addPattern( project, patterns, cb ) { // jshint ignore: line
	var list = _.map( patterns, function( count, pattern ) {
		return '    ' + pattern + ' matched ' + count + ' files';
	} );
	var message = list.length ? 'Packaging with:\n' + list.join( '\n' ) + '\nAdd a glob pattern (empty pattern to stop)' :
	'Provide a glob pattern to package with';
	inquire.prompt( [
		{
			type: 'input',
			name: 'pattern',
			message: message
		}
	], function( r ) {
			if ( _.isEmpty( r.pattern ) && list.length > 0 ) {
				// project.pack = { pattern: _.keys( patterns ).join( ',' ) };
				// cb( project );
				filterPatterns( project, patterns, cb );
			} else {
				if ( r.pattern ) {
					glob( project.path, r.pattern, [ '.git' ] )
						.then( function( matches ) {
							console.log( 'Pattern "' + r.pattern + ' matched ' + matches.length + ' files.' );
							console.log( _.map( _.take( matches, 20 ), function( m ) {
								return '    ' + m;
							} ).join( '\n' ) );
							if ( matches.length > 20 ) {
								console.log( '    ...' );
							}
							patterns[ r.pattern ] = matches.length;
							addPattern( project, patterns, cb );
						} );
				} else {
					addPattern( project, patterns, cb );
				}
			}
		} );
}

function addProject( projects, cb ) { // jshint ignore: line
	var go = function( r ) {
		return r.addProject;
	};
	var checkPath = function( p ) {
		return fs.existsSync( p ) ? true : '"' + p + '" is not a valid path.';
	};
	inquire.prompt( [
		{
			type: 'confirm',
			name: 'addProject',
			message: 'The build currently has ' + ( projects ? _.keys( projects ).length : 0 ) + ' project(s) defined. Would you like to add one',
			default: function() {
				return _.isEmpty( projects );
			}
		},
		{
			type: 'input',
			name: 'name',
			message: 'Project name',
			when: go
		},
		{
			type: 'input',
			name: 'path',
			message: 'Project working path (relative to repository root)',
			default: './',
			when: go,
			validate: checkPath
		}
	], function( r ) {
			if ( r.addProject ) {
				var project = {
					name: r.name,
					path: r.path,
					steps: {}
				};
				defineStep( project, function() {
					addPattern( project, {}, cb );
				} );
			} else {
				cb();
			}
		} );
}

function chooseFormat( cb ) {
	inquire.prompt( [
		{
			type: 'list',
			name: 'format',
			message: 'Save as',
			choices: [ 'JSON', 'YAML' ],
			default: [ 'JSON' ]
		}
	], function( r ) {
			cb( r.format.toLowerCase() );
		} );
}

function createPrompt( cb ) {
	inquire.prompt( [
		{
			type: 'confirm',
			name: 'generateBuild',
			message: 'No valid nonstop build file exists. Would you like help creating one'
		},
		{
			type: 'checkbox',
			name: 'platforms',
			message: 'What platforms will this build be valid on',
			choices: [
				{ name: 'OS X', value: 'darwin' },
				{ name: 'Windows', value: 'win32' },
				{ name: 'Linux', value: 'linux' }
			],
			default: [ 'darwin', 'linux', 'win32' ],
			when: function( r ) {
				return r.generateBuild;
			}
		},
		{
			type: 'checkbox',
			name: 'architectures',
			message: 'What architectures will this build be valid on',
			choices: [ 'x86', 'x64' ],
			default: [ 'x86', 'x64' ],
			when: function( r ) {
				return r.generateBuild;
			}
		}
	], function( r ) {
			var build = {
				platforms: {},
				projects: {}
			};
			_.each( r.platforms, function( p ) {
				var platform = build.platforms[ p ] = { architectures: [] };
				_.each( r.architectures, function( a ) {
					platform.architectures.push( a );
				} );
			} );
			function onProject( project ) {
				if ( project ) {
					build.projects[ project.name ] = {
						path: project.path,
						steps: project.steps,
						pack: project.pack
					};
					addProject( build.projects, onProject );
				} else {
					cb( build );
				}
			}
			if ( r.generateBuild ) {
				addProject( build.projects, onProject );
			} else {
				console.log( 'A nonstop file is required to use the CLI.' );
			}
		} );
}

function defineStep( project, cb ) { // jshint ignore: line
	var go = function( r ) {
		return !_.isEmpty( r.name );
	};
	var step = {};
	inquire.prompt( [
		{
			type: 'input',
			name: 'name',
			message: 'Step name'
		},
		{
			type: 'input',
			name: 'path',
			message: 'Working directory (relative to project working directory - "' + project.path + ')"',
			default: './',
			when: go
		},
		{
			type: 'input',
			name: 'command',
			message: 'Shell command to execute (included arguments will excluded)',
			when: go,
			default: function( r ) {
				return r.name;
			},
			filter: function( x ) {
				return x.split( ' ' )[ 0 ];
			}
		}
	], function( r ) {
			if ( _.isEmpty( r.name ) ) {
				cb( project );
			} else {
				step.command = r.command;
				step.path = r.path;
				step.arguments = [];
				addArgument( step, function( step ) {
					project.steps[ r.name ] = step;
					defineStep( project, cb );
				} );
			}
		} );
}

function filterPatterns( project, patterns, cb ) {
	inquire.prompt( [
		{
			type: 'checkbox',
			name: 'patterns',
			message: 'Select which patterns to include',
			choices: _.map( patterns, function( count, pattern ) {
				return { name: pattern + ' : ' + count + ' matches', value: pattern };
			} )
		}
	], function( r ) {
			project.pack = { pattern: r.patterns.join( ',' ) };
			cb( project );
		} );
}

function parseArgs( args ) {
	// primarily here because without this line, commander saves
	// state between tests and breaks everything
	delete require.cache[ require.resolve( 'commander' ) ];
	var commander = require( 'commander' );
	args = args || process.argv;
	var options = {
		action: 'build',
		nopack: false
	};

	commander
		.command( 'nopack' )
		.description( 'Run the build without creating packages' )
		.action( function() {
			options.nopack = true;
		} );

	commander
		.command( 'upload [packages...]' )
		.description( 'uploads all packages or specific package' )
		.action( function( opts ) {
			options.action = 'upload';
			if ( _.isArray( opts ) ) {
				options.packages = opts;
			}
		} );

	commander
		.version( version )
		.option( '--project <projectName>', 'limit build to a project' )
		.option( '-f, --force', 'overwrite existing packages' )
		.parse( args );

	options.project = commander.project;
	options.overwrite = ( commander.force === true );

	return options;
}

function reportError( msg, err ) {
	console.log( msg, err );
}

function selectPackage( cb ) {
	console.log( 'scanning for build packages ...' );
	pack.getList( process.cwd() )
		.then( function( packages ) {
			var packageNames = _.map( packages, function( x ) {
				return path.relative( './', x.fullPath );
			} );
			inquire.prompt( [
				{
					type: 'checkbox',
					name: 'packages',
					message: 'Select which packages you want to upload',
					choices: [ 'all' ].concat( packageNames )
				}
			], function( r ) {
					var list;
					if ( _.isEqual( r.packages, [ 'all' ] ) ) {
						cb( packages );
					} else {
						list = _.without( r.packages, 'all' );
						cb( list );
					}
				} );
		} );
}

function serverPrompt( cb ) {
	inquire.prompt( [
		{
			type: 'input',
			name: 'address',
			message: 'IP/server name',
			default: remember( 'index-address' )
		},
		{
			type: 'input',
			name: 'port',
			message: 'Port',
			default: remember( 'index-port' )
		}
	], function( r ) {
			if ( _.isEmpty( r.address ) ) {
				serverPrompt( cb );
			} else {
				remember( 'index-address', r.address );
				remember( 'index-port', r.port );
				cb( r );
			}
		} );
}

function tokenPrompt( cb ) {
	inquire.prompt( [
		{
			type: 'input',
			name: 'token',
			message: 'Enter auth token',
			default: remember( 'index-token' )
		}
	], function( r ) {
			remember( 'index-token', r.token );
			cb( r );
		} );
}

module.exports = {
	addProject: addProject,
	authChoice: authLookup,
	error: reportError,
	format: chooseFormat,
	create: createPrompt,
	parse: parseArgs,
	pick: selectPackage,
	server: serverPrompt,
	token: tokenPrompt
};
