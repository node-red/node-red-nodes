#!/bin/bash
#sudo apt-get install libbluetooth-dev libudev-dev pi-bluetooth
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
