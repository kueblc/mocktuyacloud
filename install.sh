#!/bin/bash

if [[ `id -u` == 0 ]]; then
	echo "You are running as root, run again as a regular user (without sudo)"
	echo "You will be prompted for a password if and only if a process requires it"
	exit
fi

echo "Updating and installing packages..."
# sudo apt update -y && sudo apt upgrade -y
sudo apt install -y hostapd dnsmasq haveged

if [ -s "$NVM_DIR/nvm.sh" ]; then
	echo "NVM already installed, skipping..."
else
	echo "Installing NVM..."
	wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
	export NVM_DIR="$HOME/.config"
fi

[ `command -v nvm` ] || [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Installing the latest version of node..."
nvm install node
nvm use node

# echo "Updating NPM..."
# npm -g install npm@latest

echo "Installing NPM dependencies..."
npm i

if [ -f firmware/firmware.bin ]; then
	echo "Firmware found, skipping..."
	echo "Run generate-firmware.sh to regenerate"
else
	echo "Downloading firmware..."
	./generate-firmware.sh
fi

if [ "$(command -v create_ap)" ]; then
	echo "create_ap already installed, skipping..."
else
	echo "Installing create_ap..."
	git clone https://github.com/oblique/create_ap
	cd create_ap
	sudo make install
	cd ..
fi

