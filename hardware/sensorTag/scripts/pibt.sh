#!/bin/bash
if grep -q ARM /proc/cpuinfo
then
    sudo apt-get install libbluetooth-dev libudev-dev pi-bluetooth
    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
fi
