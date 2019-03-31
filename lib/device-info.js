
const config = require('./config')

const secKeys = config.secKeys || {}
const localKeys = config.localKeys || {}
const etags = {
	"02200370": "67k",
	"07200406": "cbn",
	"06200658": "e7n",
	"06200218": "em7",
	"08761448": "e7n",
	"15173804": "mad",
	"36574146": "pfe",
	"02200194": "63g",
	"04624580": "10w4",
}
const schemaIds = {
	"02200370": "6bh",
	"07200406": "cft",
	"06200658": "ec0",
	"06200218": "eqk",
	"08761448": "ec0",
	"15173804": "mjg",
	"36574146": "pol",
	"02200194": "66z",
	"04624580": "116h",
}

const getSecKey = id => secKeys[id] || config.defaultSecKey
const getLocalKey = id => localKeys[id] || config.defaultLocalKey
const getEtag = id => ( etags[ id.substr(0,8) ] || "" ).padStart( 10, "0" )
const getSchemaId = id => ( schemaIds[ id.substr(0,8) ] || "" ).padStart( 10, "0" )
const getSchema = schemaId => {
	try {
		return require( './schemas/' + schemaId.replace(/^0+/,"") )
	} catch (e) {
		// default schema to hand out
		// device won't properly update values with the wrong schema but it continues to function
		// this is okay if all we're doing is registering it in order to flash custom firmware
		return [{"mode": "rw","property": {"type": "bool"},"id": 1,"type": "obj"}]
	}
}

module.exports = { getSecKey, getLocalKey, getEtag, getSchemaId, getSchema }

