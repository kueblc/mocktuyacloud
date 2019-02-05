
const cipher = require('../crypto/cipher')
const crc = require('../crc')

function encode( ssid, pw, region, token, secret ){
	let encoded = []
	encodeIP( encoded, assembleHeader(), 120 )
	encodeIP( encoded, assemblePlain(ssid), 64 )
	encodeIP( encoded, assembleEncrypted(pw), 0 )
	encodeIP( encoded, assemblePlain(region + token + secret), 32 )
	return encoded
}

function encodeIP( out, buffer, start ){
	for( let i = 0; i < buffer.length; i += 2, start++ ){
		out.push(["226", start, buffer[i + 1], buffer[i]].join('.'))
	}
}

function assembleHeader(){
	return Buffer.from("TYST01")
}

function assemblePlain( str ){
	let strB = Buffer.from(str)
	let strCrc = crc( Buffer.from(str) )
	let strLength = str.length
	
	let payload = Buffer.alloc( strLength + 6 )
	payload.writeInt8( strLength, 0 )
	payload.writeInt8( strLength, 1 )
	payload.writeInt32LE( strCrc, 2 )
	strB.copy( payload, 6 )
	return payload
}

function assembleEncrypted( pw ){
	let pwCrc = crc( Buffer.from(pw) )
	let encryptedPw = Buffer.from( encryptPw( pw ), 'hex' )
	let pwLength = encryptedPw.length
	
	let payload = Buffer.alloc( pwLength + 6 )
	payload.writeInt8( pwLength, 0 )
	payload.writeInt8( pwLength, 1 )
	payload.writeInt32LE( pwCrc, 2 )
	encryptedPw.copy( payload, 6 )
	return payload
}

function encryptPw( pw ){
	let pwLength = Math.ceil( pw.length / 16 ) * 16
	let pwPadded = pw.padEnd( pwLength, '\0' )
	let key = "a3c6794oiu876t54"
	let pwEncrypted = cipher.encrypt( pwPadded, key, 'hex' )
	return pwEncrypted.substr( 0, pwLength * 2 )
}

module.exports = encode

