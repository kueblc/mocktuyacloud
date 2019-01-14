
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

const config = require('./config')

const logger = require('./logger')
logger.level = config.logLevel || 0
const log = logger.log("MockTuyaApi")


// adds req.body from post data
app.use(bodyParser.text({ type: "*/*" }))

const timestamp = () => parseInt( new Date / 1000 )

const { decrypt, sign } = require('./crypto/http')
const { getSecKey } = require('./device-info')
const API = require('./api')

function parseRequest( req ){
	const params = req.query
	if( !params.a )
		return log.error( "missing api method" )
	if( !params.gwId )
		return log.error( "missing gwId" )
	const secKey = getSecKey( params.gwId )
	if( !secKey )
		log.warn( params.gwId, "no secKey found" )
	const signature = sign( params, secKey )
	if( params.sign !== signature )
		log.warn( params.gwId, "signature failed", params.sign, "should be", signature )
	const data = req.body.substr(5)
	try {
		params.data = JSON.parse( decrypt( data, secKey ) )
	} catch (e) {
		log.warn( params.gwId, "failed to decrypt payload, secKey may be wrong" )
		log.debug( data )
	}
	return params
}

function generateResponse( params ){
	const response = {}
	const handler = API[ params.a ]
	if( handler ){
		const result = handler( params )
		if( result ) response.result = result
	}
	response.t = timestamp()
	response.e = false
	response.success = true
	return JSON.stringify( response ) + "\n"
}

app.use( ( req, res, next ) => {
	const params = parseRequest( req )
	if( !params ) return next()
	log.info( params.a, "from", params.gwId )
	log.debug( params )
	const response = generateResponse( params )
	log.info( "responding", response )
	res.send( response )
})

app.use( express.static(__dirname + '../firmware') )

app.listen( config.port, config.host, () => log.info( "server started on", config.host, "port", config.port ) )

