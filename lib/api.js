

const { getSecKey, getLocalKey, getEtag, getSchemaId, getSchema } = require('./device-info')

const { uid, timeZone, location } = require('./config')

const timestamp = () => parseInt( new Date / 1000 )

// devices call this to see if there are any timers set
// it also seems its called when protocol 13 comes over mqtt
function sGwDevTimerCount( params ){
	return {
		"devId":  params.gwId,
		"count": 0,
		"lastFetchTime": timestamp() - 15
	}
}

// devices call this if sGwDevTimerCount returns > 0 to see what timers are set
// TODO recreate timer tracking
function sGwDevTimerGet( params ){
	return {
		"devId": params.gwId,
		"timers": [{"date": "00000000","dps": {"2": true},"loops": 62,"id": "8848392","time": "18:02"}]
	}
}

// second step in activating a device
// post data payload is encrypted with authKey.slice(0,16)
// TODO find authKey
// TODO automatically resolve etag and schema
// assign the device schema and encryption keys
// payloads here on out are encrypted with secKey
// localKey is used for control over LAN
function sGwDevPkActive( params ){
	const schemaId = getSchemaId( params.gwId )
	const schema = getSchema( schemaId )
	return {
		"schema": JSON.stringify( schema ),
		"uid": uid,
		"devEtag": getEtag( params.gwId ),
		"secKey": getSecKey( params.gwId ),
		"schemaId": schemaId,
		"localKey": getLocalKey( params.gwId )
	}
}

// first step in activating a device
// called with the token received over the UDP broadcast linking routine
// post data payload is encrypted with authKey.slice(0,16)
// TODO find authKey
// returns API and MQTT endpoints and time info
function sGwTokenGet( params ){
	return {
		"gwApiUrl": "http://a.tuya" + location + ".com/gw.json",
		"stdTimeZone": timeZone,
		"mqttRanges": "",
		"timeZone": timeZone,
		"httpsPSKUrl": "https://a3.tuya" + location + ".com/gw.json",
		"mediaMqttUrl": "s.tuya" + location + ".com",
		"gwMqttUrl": "mq.gw.tuya" + location + ".com",
		"dstIntervals": [
			[ 1552201200, 1572760800 ],
			[ 1583650800, 1604210400 ],
			[ 1615705200, 1636264800 ],
			[ 1647154800, 1667714400 ],
			[ 1678604400, 1699164000 ],
			[ 1710054000, 1730613600 ]
		]
	}
}

function tuyaDeviceDynamicConfigGet( params ){
	return {
		"validTime": 1800,
		"time": timestamp(),
		"config": {}
	}
}

// older devices call this to upgrade firmware when protocol 15 comes over mqtt
function sGwUpgrade( params ){
	const etag = params.data && params.data.etag
	if( !etag ) return
	return {
		"fileSize": "",
		"etag": etag,
		"version": "",
		"url": "",
		"md5": ""
	}
}

// newer devices call this to upgrade firmware when protocol 15 comes over mqtt
function tuyaDeviceUpgradeGet( params ){
	return // XXX empty return means no update
	return {
		"size": "825947",
		"cdnUrl": "http://images.tuyaus.com/smart/firmware/upgrade/201810/1539875023-oem_esp_dltj_ug_1.1.0.bin",
		"originalUrl": "http://s3-us-west-2.amazonaws.com/airtake-public-data/smart/firmware/upgrade/201810/1539875023-oem_esp_dltj_ug_1.1.0.bin",
		"httpsUrl": "https://s3-us-west-2.amazonaws.com/airtake-public-data/smart/firmware/upgrade/201810/1539875023-oem_esp_dltj_ug_1.1.0.bin",
		"version": "1.1.0",
		"url": "http://s3-us-west-2.amazonaws.com/airtake-public-data/smart/firmware/upgrade/201810/1539875023-oem_esp_dltj_ug_1.1.0.bin",
		"md5": "1142247a63a44dd97896c4fe6abd53f0"
	}
}

// new and old devices seem to call this on start up
function tuyaDeviceUpgradeSilentGet( params ){
	return // XXX empty return means no update
	return {
		"url": "http://tuyaus.com/ota/tuya-sonoff.bin",
		"type": 0,
		"size": "478491",
		"md5": "79e9748319d7ad888f2deff16a87a296",
		"version": "1.1.0",
	}
}

const API = module.exports = {
	"atop.online.debug.log": params => true,
	"s.gw.token.get": sGwTokenGet,
	"s.gw.dev.pk.active": sGwDevPkActive,
	"s.gw.dev.timer.count": sGwDevTimerCount,
	"s.gw.dev.timer.get": sGwDevTimerGet,
	"tuya.device.log.report": params => true,
	"tuya.device.dynamic.config.get": tuyaDeviceDynamicConfigGet,
	"s.gw.upgrade": sGwUpgrade,
	"tuya.device.upgrade.get": tuyaDeviceUpgradeGet,
	"tuya.device.upgrade.silent.get": tuyaDeviceUpgradeSilentGet,
	"s.gw.update": params => {},
	"s.gw.dev.update": params => {},
	"s.gw.reset": params => {},
}

