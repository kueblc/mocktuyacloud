
const MessageType = {
	UDP: 0,
	AP_CONFIG: 1,
	ACTIVE: 2,
	BIND: 3,
	RENAME_GW: 4,
	RENAME_DEVICE: 5,
	UNBIND: 6,
	CONTROL: 7,
	STATUS: 8,
	HEART_BEAT: 9,
	DP_QUERY: 10
}

const MessageTypeNames = Object.keys(MessageType)

const parse = function( buffer ){
	if( buffer.length < 24 ) throw "Packet too small"
	if( buffer.readInt32BE(0) !== 0x000055aa ) throw "Missing header"
	const sequence = buffer.readInt32BE(4)
	const type = buffer.readInt32BE(8)
	const typeName = MessageTypeNames[type]
	if( !typeName ) throw "Unrecognized message type"
	const length = buffer.readInt32BE(12)
	if( buffer.length - 16 < length ) throw "Expected payload length "+length+" was "+(buffer.length - 16)
	const code = buffer.readInt32BE(16)
	const crcSum = buffer.readInt32BE( length + 8 )
	if( crc(buffer.slice(0, length + 8)) !== crcSum ) throw "CRC mismatch"
	if( buffer.readInt32BE( length + 12 ) !== 0x0000aa55 ) throw "Missing footer"
	let payload = buffer.slice(20, length + 8).toString()
//	if( code ) console.log("Non zero code:", payload)
	if( buffer.length - 16 !== length )
		return [ { sequence, type, code, payload }, ...parse(buffer.slice( length + 16 )) ]
	else
		return [ { sequence, type, code, payload } ]
}

let sequence = 0
const crc = require('./crc')
const encode = function ( payload, command ) {
	const buffer = Buffer.alloc( payload.length + 24 )
	buffer.writeInt32BE( 0x000055aa, 0 ) // magic prefix
	buffer.writeInt32BE( sequence++, 4 ) // sequence number
	buffer.writeInt32BE( command, 8 ) // command
	buffer.writeInt32BE( payload.length + 8, 12 ) // length
	buffer.write( payload, 16 )
	buffer.writeInt32BE( crc(buffer.slice(0,-8)), payload.length + 16 ) // checksum
	buffer.writeInt32BE( 0x0000aa55, payload.length + 20 ) // magix suffix
	return buffer
}

module.exports = { parse, encode, MessageType }
