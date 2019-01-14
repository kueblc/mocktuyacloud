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
		if( ids.includes(id) || !ids.length ){
			log.info( "moving", id, "to", ssid )
			TuyaLocalControl.apConfig( ip, ssid, passwd )
		}
	})

	TuyaDeviceMonitor.start()
}

// override the tuya.device.upgrade.silent.get api call
const API = require('./lib/api')

API["tuya.device.upgrade.silent.get"] = params => {}
/*	if( ids.includes(params.gwId) || !ids.length )
		return {
			"url": "http://a.tuyaus.com/firmware.bin",
			"type": 0,
			"size": "478491",
			"md5": "79e9748319d7ad888f2deff16a87a296",
			"version": "4.2.0",
		}
}*/

// link any new devices, MockTuyaApi handles issuing keys
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


