#!/bin/bash

cd firmware

# package stage 1
wget https://github.com/mirko/SonOTA/raw/master/static/image_user2-0x81000.bin
cat header image_user2-0x81000.bin image_user2-0x81000.bin > firmware.bin

# download stage 2
wget https://github.com/arendst/Sonoff-Tasmota/releases/download/v6.2.1/sonoff.bin
mkdir -p ota
mv sonoff.bin ota/image_arduino.bin

cd ..
