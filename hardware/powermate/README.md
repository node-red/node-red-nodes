PowerMate
=========
A Node-Red node to read from the [Griffin PowerMate] (http://www.amazon.co.uk/gp/product/B003VWU2WA/ref=as_li_ss_tl?ie=UTF8&camp=1634&creative=19450&creativeASIN=B003VWU2WA&linkCode=as2&tag=bespl-21)

Install
-------

This module depends on the node-powermate node so you will need to run 

	npm install node-powermate

Usage
-----

This node outputs messages for 3 different events

 + Button down
 + Button up
 + Wheel rotation

For the first 2 the message payload of 'up' or 'down' respectively is published to the topic + '/button'. For the wheel rotation the message payload is +ve for clockwise and -ve for anti-clockwise on the topic + '/wheel'

Permissions
-----
Depending on OS, you may get an error that looks something like 

    cannot open device with path 0001:0004:00
    
If this happens, it is likely because your user doesn't have permissions for the PowerMate device. In Linux (specifically Raspbian), creating the file /etc/udev/rules/95-powermate.rules and entering the following text:

    SUBSYSTEM=="usb", ATTRS{idVendor}=="077d", ATTRS{idProduct}=="0410", SYMLINK+="powermate", MODE="660", GROUP="input"

will assign the PowerMate device to the "input" group, which the pi user belongs to. For other OSs, change the GROUP entry to a group that your user belongs to.

