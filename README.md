# Mock Tuya Cloud
Intended to be a general purpose framework for interacting with Tuya devices without the Tuya operated cloud. You can take control of your devices, prevent data leak, and unlock the full potential of your hardware.

Currently geared toward uploading custom firmware over the air for [https://github.com/codetheweb/tuyapi/issues/49]

Feel free to take part either by applying any part of this code to your project or by submitting code, logs, feedback, suggestions, data back my way

### Note: For the purposes of flashing custom firmware, I now recommend tuya-convert as it is better supported and designed strictly for this purpose

## Work in progress! Please do not use this unless you really know what you are doing. You can break things with this! That's on you

## Steps to upload a custom firmware

Requires a wifi card that supports AP mode in order to get the devices to connect directly

Run or follow install.sh to get dependencies and build the first stage firmware

If you have any devices already added to your network, make sure nothing else is talking to them over LAN (ie vendor app, tuyapi, your home automation setup...)

OPTIONAL: if you have device keys you can add them to device-info.js as gwId: key pairs so messages can be decrypted (not necessary for uploading firmware but interesting information)

If you have any devices not yet added via the official vendor's app, you can put it in config mode now (hold 5 seconds until flashing etc)

Then run or follow ota-firmware.sh which will
* spawn a new wifi AP alongside your existing connection
* create a MockTuyaCloud instance with appropriate MQTT and API handling
* encourage unlinked devices to connect to it
* encourage existing devices to switch to it
* ask devices to upgrade via MQTT
* serve the first stage firmware file

When done hit Ctrl-C and the cloud goes poof

At this point your device should be broadcasting a FinalStage SSID, this means you successfully flashed the device and no longer have Tuya firmware. You can continue with stage two in order to complete Tasmota installation.

You can serve stage two by connecting to the FinalStage AP and running `python -m SimpleHTTPServer 8080` inside the firmware directory. You should see ota/image_arduino.bin being requested. You can then connect to the sonoff-**** AP and browse to http://192.168.4.1/ to configure your WiFi credentials. Finally, connect back to your network and browse to your device's IP address to complete your Tasmota configuration, including setting module and MQTT information.

## TODO
- [ ] learn to organize
- [ ] automate firmware header generation and packaging
- [ ] possibly automate second & third stage or pass off to another script
- [ ] foolproof the firmware procedure
- [ ] move specific use cases into an examples folder
- [ ] refactor device-info
- [ ] more thanks
- [ ] flesh out todo list
- [ ] add appropriate license(s) and cite borrowed code

## Thanks
@drushbrook for capture of OTA firmware update

@codetheweb et al for tuyapi

@SynAckFin for discovery and development of two stage firmware strategy

@GeorgeIoak and @mssmison for testing and debugging

Many more

