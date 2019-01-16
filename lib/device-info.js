
const config = require('./config')

const secKeys = {}
const localKeys = {}
const etags = {
	"02200370": "000000067k",
	"07200406": "0000000cbn",
}
const schemaIds = {
	"02200370": "00000006bh",
	"07200406": "0000000cft",
}

const getSecKey = id => secKeys[id] || config.defaultSecKey
const getLocalKey = id => localKeys[id] || config.defaultLocalKey
const getEtag = id => etags[ id.substr(0,8) ] || "0000000xxx"
const getSchemaId = id => schemaIds[ id.substr(0,8) ] || "0000000xxx"
const getSchema = schemaId => {
	try {
		return require( './schemas/' + schemaId )
	} catch (e) {
		// default schema to hand out
		// device won't properly update values with the wrong schema but it continues to function
		// this is okay if all we're doing is registering it in order to flash custom firmware
		return [{"mode": "rw","property": {"type": "bool"},"id": 1,"type": "obj"}]
	}
}

module.exports = { getSecKey, getLocalKey, getEtag, getSchemaId, getSchema }

