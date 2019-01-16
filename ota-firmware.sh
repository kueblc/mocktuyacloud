#!/bin/bash

# dependencies:
#	bash (to run this script)
#	util-linux (for getopt)
#	procps or procps-ng
#	hostapd
#	iproute2
#	iw
#	iwconfig (you only need this if 'iw' can not recognize your adapter)
#	haveged (optional)
#	dnsmasq
#	iptables
#	nodejs

GATEWAY="192.168.12.1"
SSID="tuya_mdev_test"
PASSWD="a3c6794oiu876t54"
HOSTS=$(readlink -f ./tuya_hosts)

sudo echo "Creating network at $SSID"
sudo create_ap -n wlan0 -e $HOSTS -g $GATEWAY $SSID $PASSWD &
sleep 5

sudo setcap 'cap_net_bind_service=+ep' `command -v node`
node index

sudo killall create_ap
