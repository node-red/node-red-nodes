node-red-node-feedparser
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to read RSS and Atom feeds.

**Note** : This is the same node as is/was in the core of Node-RED. If you already
have it installed you do NOT need this node. However it will be deprecated from
the core in due course, at which point you will need to install it from here if
still required.

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
