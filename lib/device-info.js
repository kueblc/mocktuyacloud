
const config = require('./config')

const secKeys = {}
const localKeys = {}
const etags = {
	"07200406": "0000000cbn",
}
const schemaIds = {
	"07200406": "0000000cft",
}

const getSecKey = id => secKeys[id] || config.defaultSecKey
const getLocalKey = id => localKeys[id] || config.defaultLocalKey
const getEtag = id => etags[ id.substr(0,8) ] || "0000000cbn"
const getSchemaId = id => schemaIds[ id.substr(0,8) ] || "0000000cft"
const getSchema = schemaId => {
	try {
		return require( './schemas/' + schemaId )
	} catch (e) {
		return [{"mode": "rw","property": {"type": "bool"},"id": 1,"type": "obj"}]
	}
}

module.exports = { getSecKey, getLocalKey, getEtag, getSchemaId, getSchema }

