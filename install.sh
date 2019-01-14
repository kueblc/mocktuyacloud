#!/bin/bash

echo "Installing NPM dependencies..."
npm i

echo "Downloading firmware..."
./generate-firmware.sh

echo "Installing create_ap..."
git clone https://github.com/oblique/create_ap
cd create_ap
sudo make install
cd ..

