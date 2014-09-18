node-red-node-dweetio
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send and receive simple dweets.

This node does **NOT** support private or "locked" dweets.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-dweetio


Usage
-----

###Output

Sends the **msg.payload** to Dweet.io


Optionally uses **msg.thing** to set the thing id, if not already set in the properties.

You need to make the thing id unique - you are recommended to use a GUID.

###Input

Listens for messages from Dweet.io

The thing id should be globally unique as they are all public - you are recommended to use a GUID.

The Thing ID is set into **msg.dweet**, and the timesamp into **msg.created**.


For further info see the <a href="https://dweetio.io/" target="_new">Dweet.io website</a>


###Sample Flow

Cut the text below - then in Node-RED use Ctrl-I (Import) - Ctrl-V (Paste) to insert into your workspace.

    [{"id":"58bfbfe.fa7404","type":"debug","name":"","active":true,"console":"false","complete":"false","x":401,"y":211,"z":"8f1399c1.70ec68","wires":[]},{"id":"bc69a077.43966","type":"dweetio out","thing":"not-very-random-big-string","name":"","x":409,"y":135,"z":"8f1399c1.70ec68","wires":[]},{"id":"aaad178a.5552e8","type":"dweetio in","thing":"not-very-random-big-string","name":"","x":153,"y":211,"z":"8f1399c1.70ec68","wires":[["58bfbfe.fa7404"]]},{"id":"db15a21f.24ea6","type":"inject","name":"","topic":"Ticktock","payload":"","payloadType":"date","repeat":"","crontab":"","once":false,"x":160,"y":136,"z":"8f1399c1.70ec68","wires":[["bc69a077.43966"]]}]
