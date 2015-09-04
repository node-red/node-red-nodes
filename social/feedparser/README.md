node-red-node-feedparser
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to read RSS and Atom feeds.

**Note** : This is the same node as was in the core of Node-RED.
As of v0.10.8 it will be installed from here instead.

Install
-------

Run the following command in the user directory of your Node-RED install.
By default this is `.node-red`

        npm install node-red-node-feedparser

Usage
-----

Provides two nodes - one to receive messages, and one to send.

###Input

Monitors an RSS/atom feed for new entries.

You can set the polling time in minutes. Defaults to 15 minutes.
