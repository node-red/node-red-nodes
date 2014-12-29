#!/bin/bash

echo "*********************************************"
echo "Moving gpiohb to /usr/local/bin/"
if [[ $EUID -ne 0 ]]; then
    echo "Not running as user root" 2>&1
    echo "please run the following commands manually"
    echo "    sudo cp $PWD/gpiohb /usr/local/bin/gpiohb"
    echo "    sudo chmod 4755 /usr/local/bin/gpiohb"
    echo "or re-run npm install as root / sudo"
    echo "*********************************************"
    exit 1
else
    cp gpiohb /usr/local/bin/
    chmod 4755 /usr/local/bin/gpiohb
    echo "OK - gpiohb moved to /usr/local/bin"
    echo "*********************************************"
fi
