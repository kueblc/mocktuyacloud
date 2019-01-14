module.exports = {
	host: "192.168.12.1",
	port: 80, // this is the port the mock server will run on, reverse proxy this to 80
	ssid: "tuya_mdev_test",
	passwd: "a3c6794oiu876t54",
	logLevel: 0, // 0 == debug, 1 == info, 2 == warn, 3 == error, 4 == quiet
	uid: "", // user id, can be whatever, doesn't seem to be used
	timeZone: "-05:00", // your timezone
	location: "us", // us/eu/cn
	defaultSecKey: "0123456789abcdef", // 16 chars
	defaultLocalKey: "must be 16 chars", // 16 chars
}
