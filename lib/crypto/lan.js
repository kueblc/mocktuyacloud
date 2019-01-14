
const { encrypt, decrypt, md5 } = require('./cipher')
const log = require('../logger').log("LANCipher")

const sign = ( data, key, version ) =>
	md5('data=' + data + '||lpv=' + version + '||' + key).substr(8, 16)

function TuyaEncrypt( data, key, version = "2.1" ){
	const encrypted = encrypt( data, key )
	const signature = sign( encrypted, key, version )
	return version + signature + encrypted
}

function TuyaDecrypt( data, key, expectedVersion = "2.1" ){
	const version = data.slice( 0, 3 )
	if( expectedVersion !== version )
		log.warn("Invalid version, expected", expectedVersion, "got", version)
	const signature = data.slice( 3, 19 )
	const payload = data.slice( 19 )
	const expectedSignature = sign( payload, key, version )
	if( expectedSignature !== signature )
		log.warn("Invalid MD5, expected", expectedSignature, "got", signature)
	return decrypt( payload, key )
}

module.exports = { encrypt: TuyaEncrypt, decrypt: TuyaDecrypt }

