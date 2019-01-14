
const { decrypt, md5 } = require('./cipher')

function sign( parts, key ){
	const params = Object.keys(parts).sort()
	const pairs = []
	for( const param of params ){
		if( param === 'sign' ) continue
		pairs.push( param + "=" + parts[param] )
	}
	pairs.push( key )
	const data = pairs.join('||')
	return md5(data)
}

module.exports = { decrypt: ( data, key ) => decrypt( data, key, 'hex' ), sign }

