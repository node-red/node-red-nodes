node-red-node-sentiment
========================

A <a href="http://nodered.org" target="new">Node-RED</a> node that scores incoming words
using the AFINN-165 wordlist and attaches a sentiment.score property to the msg.

NOTE: There is also a multi-language version available - **node-red-node-multilang-sentiment**.

Install
-------

This is a node that should be installed by default by Node-RED so you should not have to install it manually. If you do then run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-sentiment


Usage
-----

Uses the AFINN-165 wordlist to attempt to assign scores to words in text.

Attaches `msg.sentiment` to the msg and within that `msg.sentiment.score` holds the score.

A score greater than zero is positive and less than zero is negative. The score typically ranges from -5 to +5, but can go higher and lower.

See the <a href="https://github.com/thisandagain/sentiment/blob/develop/README.md" target="_blank">Sentiment docs here</a>.</p>
