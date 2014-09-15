#!/bin/bash
#Author : Anupam Datta

clear

# install Node-RED extra nodes

#Analysis Nodes

node_1 () {
	npm install node-red-node-wordpos
	npm install node-red-node-badwords
}

#Hardware Nodes

node_2 () {
	npm install node-red-node-piface
	npm install node-red-node-pibrella
	npm install node-red-node-piliter
	npm install node-red-node-makeymakey
	npm install node-red-node-wemo
	npm install node-red-node-blinkstick
	npm install node-red-node-blink1
	npm install node-red-node-ledborg
	npm install node-red-node-digirgb
	npm install sensortag
	npm install node-red-node-beaglebone
}

#IO Nodes

node_3 () {
	npm install node-red-node-stomp
	npm install node-red-node-wol
	npm install node-red-node-ping
}

#Social Nodes

node_4 () {
	npm install node-red-node-twilio
	npm install node-red-node-nma
	npm install node-red-node-prowl
	npm install node-red-node-pushbullet
	npm install node-red-node-pushover
	npm install node-red-node-xmpp
}

#Storage Nodes

node_5 () {
	npm install node-red-node-leveldb
	npm install node-red-node-mysql
	npm install node-red-contrib-sqlite
}

#Time Nodes

node_6 () {
	npm install node-red-node-suncalc
}

#Misc Nodes

node_7 () {
echo
echo "Not available"
read -p "Press Enter to Go back to Menu" menu
if [ "$menu" = '' ]; then
clear
function_node
fi
}


#Exit Node

node_8 () {
exit
clear
}


function_node () {
echo "==============================================================="
echo "              NODE-RED 'extra node' INSTALLATION"
echo "==============================================================="
echo
echo
echo "Do you want to install extra nodes?"
echo "[1] if 'yes' enter 1"
echo "[2] for exit enter 0"
echo
echo

read -p "# Enter choice:  " character
if [ "$character" = "1" ]; then
	echo "----------------------"
	echo "Extra Node Category : "
	echo "----------------------"
	echo
	echo "[1] Analysis"
	echo "[2] Hardware"
	echo "[3] IO"
	echo "[4] Social"
	echo "[5] Storage"
	echo "[6] Time"
	echo "[7] Miscellaneous"
	echo "[8] EXIT"
	echo
	echo "-----------------------"
	echo "Select node category :"
	echo "-----------------------"
	echo
	read -p "# Enter choice:  " ch
	for choice in $ch; do
	if [ $choice == '' ]; then break; fi
	eval node_$choice
	done

		else
		if [ "$character" = "0" ]; then
		echo "Installation aborted"
		clear
    		fi
	fi
}

#Menu for install 
function_node
