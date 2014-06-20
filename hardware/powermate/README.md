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


