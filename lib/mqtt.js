
const log = require('./logger').log("MockTuyaMQTT")
const config = require('./config')

function spawnMQTTserver(){
	const mosca = require('mosca')
	const server = new mosca.Server({ host: config.host })
	server.on( 'ready', () => log.info( "mqtt started on", config.host, "port", 1883 ) )

	server.on( 'published', packet => {
		const { topic, payload } = packet
		onMessage( topic, payload )
	})
	return ( topic, payload ) => server.publish({ topic, payload, qos: 1, retain: false })
}

function spawnMQTTclient(){
	const mqttlib = require('mqtt')
	const client = mqttlib.connect( 'mqtt://' + config.host )

	client.on( 'connect', () => {
		client.subscribe('smart/device/+/+', error => {
			if( error )
				log.error( "could not subscribe to MQTT topic" )
			else
				log.debug( "connected to MQTT as a client" )
		})
	})
	 
	client.on( 'message', onMessage )
	return ( topic, payload ) => client.publish( topic, payload, { qos: 1, retain: false })
}

const publish = (config.mqttClient ? spawnMQTTclient : spawnMQTTserver)()

const { getLocalKey } = require('./device-info')

const crypto = require('./crypto/mqtt')
const timestamp = () => parseInt( new Date / 1000 )

function onMessage( topic, payload ){
	if( !topic.startsWith("smart/device/") ) return
	const [ , , direction, id ] = topic.split('/')
	if( !direction || !id ) return
	const data = parse( id, payload.toString() )
	if( !data ) return
	log.debug( direction === "in" ? "to" : "from", id, data )
	if( direction === "out" && data.protocol === 4 )
		log.info( "dp update", id, data.data.dps )
}

// control device dps
function set( id, dps ){
	const payload = {"data":{"devId":id,"dps":dps},"protocol":5,"s":-1,"t":timestamp()}
	send( id, payload )
}

// puts the device back into config mode
function reset( id ){
	protocol( id, 11 )
}

// tells the device to poll home for timer updates
function updateTimer( id ){
	protocol( id, 13 )
}

// tells the device to poll home for firmware updates
function updateFirmware( id ){
	protocol( id, 15 )
}

function protocol( id, x ){
	const payload = {"data":{"devId":id,"gwId":id},"protocol":x,"t":timestamp()}
	send( id, payload )
}

function send( id, data ){
	const key = getLocalKey( id )
	if( !key ) return
	const payload = crypto.encrypt( JSON.stringify(data), key )
	const topic = 'smart/device/in/' + id
	publish( topic, payload )
}

function parse( id, data ){
	const key = getLocalKey( id )
	if( !key ) return
	try {
		return JSON.parse( crypto.decrypt( data, key ) )
	} catch (e) {
		try {
			return JSON.parse( data )
		} catch (e) {
			return data
		}
	}
}

module.exports = { set, reset, updateTimer, updateFirmware }

