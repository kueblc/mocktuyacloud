
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
	DP_QUERY: 10,
	QUERY_WIFI: 11,
	TOKEN_BIND: 12,
	CONTROL_NEW: 13,
	ENABLE_WIFI: 14,
	DP_QUERY_NEW: 16,
	SCENE_EXECUTE: 17,
	UDP_NEW: 19,
	AP_CONFIG_NEW: 20,
	LAN_GW_ACTIVE: 240,
	LAN_SUB_DEV_REQUEST: 241,
	LAN_DELETE_SUB_DEV: 242,
	LAN_REPORT_SUB_DEV: 243,
	LAN_SCENE: 244,
	LAN_PUBLISH_CLOUD_CONFIG: 245,
	LAN_PUBLISH_APP_CONFIG: 246,
	LAN_EXPORT_APP_CONFIG: 247,
	LAN_PUBLISH_SCENE_PANEL: 248,
	LAN_REMOVE_GW: 249,
	LAN_CHECK_GW_UPDATE: 250,
	LAN_GW_UPDATE: 251,
	LAN_SET_GW_CHANNEL: 252,
}

const MessageTypeNames = Object.keys(MessageType)

const parse = function( buffer ){
	if( buffer.length < 24 ) throw "Packet too small"
	if( buffer.readUInt32BE(0) !== 0x000055aa ) throw "Missing header"
	const sequence = buffer.readUInt32BE(4)
	const type = buffer.readUInt32BE(8)
	const typeName = MessageTypeNames[type]
	if( !typeName ) throw "Unrecognized message type"
	const length = buffer.readUInt32BE(12)
	if( buffer.length - 16 < length ) throw "Expected payload length "+length+" was "+(buffer.length - 16)
	const code = buffer.readUInt32BE(16)
	const crcSum = buffer.readUInt32BE( length + 8 )
	if( crc(buffer.slice(0, length + 8)) !== crcSum ) throw "CRC mismatch"
	if( buffer.readUInt32BE( length + 12 ) !== 0x0000aa55 ) throw "Missing footer"
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
	buffer.writeUInt32BE( 0x000055aa, 0 ) // magic prefix
	buffer.writeUInt32BE( sequence++, 4 ) // sequence number
	buffer.writeUInt32BE( command, 8 ) // command
	buffer.writeUInt32BE( payload.length + 8, 12 ) // length
	buffer.write( payload, 16 )
	buffer.writeUInt32BE( crc(buffer.slice(0,-8)), payload.length + 16 ) // checksum
	buffer.writeUInt32BE( 0x0000aa55, payload.length + 20 ) // magix suffix
	return buffer
}

module.exports = { parse, encode, MessageType }
