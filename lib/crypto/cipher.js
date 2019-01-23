
const crypto = require('crypto')
const log = require('../logger').log("Cipher")

const encrypt = ( data, key, format = 'base64' ) => {
	const cipher = crypto.createCipheriv('aes-128-ecb', key, '')
	let encrypted = cipher.update(data, 'utf8', format)
	encrypted += cipher.final('base64')
	return encrypted
}

const decrypt = ( data, key, format = 'base64' ) => {
	if( key.length !== 16 )
		return log.error( "key must be 16 characters, counted", key.length, key )
	try {
		const cipher = crypto.createDecipheriv('aes-128-ecb', key, '')
		let decrypted = cipher.update(data, format, 'utf8')
		decrypted += cipher.final('utf8')
		return decrypted
	} catch( e ) {
		log.error( "decrypt failed, is the key correct?", key )
	}
}

const md5 = data => crypto.createHash('md5').update(data, 'utf8').digest('hex')

module.exports = { encrypt, decrypt, md5 }

