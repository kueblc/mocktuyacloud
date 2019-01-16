const config = require('./lib/config')
const logger = require('./lib/logger')
const log = logger.log("MockTuyaCloud")

const TuyaAPIServer = require('./lib/server')
const TuyaMQTTServer = require('./lib/mqtt')
const TuyaLocalControl = require('./lib/local-control')
const TuyaDeviceMonitor = require('./lib/udp-monitor')

const ids = [] // empty id list means all

function reconnectDevices( ssid, passwd, ids = [] ){
	TuyaDeviceMonitor.on( 'new', device => {
		const { gwId: id, ip, productKey, version } = device
		log.info( "found device", id, "at", ip )
		if( ids.length && !ids.includes(id) ) return
		if( ip.startsWith("192.168.12.") ){
			// these devices are connected to the new network
			// ask them to upgrade in a second
			log.info( "requesting", id, "to upgrade via MQTT" )
			setTimeout( () => TuyaMQTTServer.updateFirmware(id), 1000 )
		} else {
			// these devices are connected to the old network
			// move them to the new network
			log.info( "moving", id, "to", ssid )
			TuyaLocalControl.apConfig( ip, ssid, passwd )
			// let it be found again
			delete TuyaDeviceMonitor.devices[ id ]
		}
	})

	TuyaDeviceMonitor.start()
}

// override the tuya.device.upgrade.silent.get api call
const API = require('./lib/api')

const upgrade = {
	"url": "http://a.tuyaus.com/firmware.bin",
	"size": "478491",
	"md5": "79e9748319d7ad888f2deff16a87a296",
	"version": "4.2.0",
}

// many devices seem to call this on start up or on switching to a new network
API["tuya.device.upgrade.silent.get"] = params => {
	if( ids.includes(params.gwId) || !ids.length )
		return {
			"url": upgrade.url,
			"type": 0,
			"size": upgrade.size,
			"md5": upgrade.md5,
			"version": upgrade.version
		}
}

// older devices call this to upgrade firmware when protocol 15 comes over mqtt
// FIXME format looks good yet devices won't take, something must be missing
// or perhaps some devices just don't accept OTA upgrades
API["s.gw.upgrade"] = params => {
	const etag = params.data && params.data.etag || "0000000xxx"
	if( !etag ) return
	return {
		"fileSize": upgrade.size,
		"etag": etag,
		"version": upgrade.version,
		"url": upgrade.url,
		"md5": upgrade.md5
	}
}

// newer devices call this to upgrade firmware when protocol 15 comes over mqtt
API["tuya.device.upgrade.get"] = params => {
	return {
		"size": upgrade.size,
		"cdnUrl": upgrade.url,
		"originalUrl": upgrade.url,
		"httpsUrl": upgrade.url,
		"version": upgrade.version,
		"url": upgrade.url,
		"md5": upgrade.md5
	}
}

// link any new devices, MockTuyaApi handles issuing keys
// I tweaked some timing in my version that speeds it up and possibly more reliable
// I oughta do some more testing and submit changes upstream
const TuyaLink = require('@tuyapi/link').manual
const link = new TuyaLink

log.info("prompting unlinked devices to connect to the network")
link.registerSmartLink({
	region: 'AZ',
	token: 'abcdefgh',
	secret: '0000',
	ssid: config.ssid,
	wifiPassword: config.passwd,
}).then(() => link.cleanup())

// move existing devices to the new network
reconnectDevices( config.ssid, config.passwd, ids )


