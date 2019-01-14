
const TuyaFrame = require('./lan-frame')
const net = require('net')

function send( ip, buffer ){
	const client = new net.Socket
	client.connect( 6668, ip )
	client.on( 'connect', () => {
		client.write( buffer )
		client.destroy()
	})
	client.on( 'error', console.log )
}

function apConfig( ip, ssid, passwd ){
	const payload = JSON.stringify({ ssid, passwd, token: "" })
	const buffer = TuyaFrame.encode( payload, TuyaFrame.MessageType.AP_CONFIG )
	send( ip, buffer )
}

// TODO convenience functions for LAN control

module.exports = { apConfig }

