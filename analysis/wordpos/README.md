node-red-node-wordpos
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that breaks a sentance into the various parts of (English) speech.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-wordpos


Usage
-----

Uses the wordpos npm to analyse the **msg.payload** and classify the part-of-speech of each word.

The resulting message has a **msg.pos** object added with the results split into the following:

    nouns:[],
    verbs:[],
    adjectives:[],
    adverbs:[],
    rest:[]

**Note:** a word may appear in multiple POS (eg, 'great' is both a noun and an adjective).
