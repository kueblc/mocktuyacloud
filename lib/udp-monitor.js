
const dgram = require('dgram')
const TuyaFrame = require('./lan-frame')

const EventEmitter = require('events')
const TuyaDeviceMonitor = module.exports = new EventEmitter

const devices = TuyaDeviceMonitor.devices = {}

const onMessage = message => {
	const frames = TuyaFrame.parse(message)
	for( const frame of frames ){
		const payload = JSON.parse( frame.payload )
		if( payload.gwId in devices ) return
		devices[ payload.gwId ] = payload
		TuyaDeviceMonitor.emit( 'new', payload )
	}
}

const onError = error => {
	console.log(error)
}

const socket = dgram.createSocket('udp4')
socket.on('message', onMessage)
socket.on('error', onError)

const start = TuyaDeviceMonitor.start = () => {
	socket.bind( 6666 )
}

const stop = TuyaDeviceMonitor.stop = () => {
	socket.close()
}

