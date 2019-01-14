/* Logger.js
 * written by Colin Kuebler 2012-2019
 * licensed under GPLv3
 */

const Logger = exports

const levels = [ "DEBUG", "INFO", "WARNING", "ERROR" ]

Logger.level = 0

Logger.log = function( src ){

	const println = function( level, src, ...msg ){
		if( Logger.level <= level ){
			const timestamp = (new Date).toLocaleString()
			console.log( "[%s] [%s] %s:", levels[level], timestamp, src, ...msg )
		}
	}

	return {
		debug: println.bind( this, 0, src ),
		info: println.bind( this, 1, src ),
		warn: println.bind( this, 2, src ),
		error: println.bind( this, 3, src ),
	}
}

