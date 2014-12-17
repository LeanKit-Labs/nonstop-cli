#!/usr/bin/env node

var build = require( 'nonstop-build' )();
var index = require( 'nonstop-index-client' );
var prompt = require( './prompt.js' );

require( './machine.js' )( process.cwd(), prompt, build, index );