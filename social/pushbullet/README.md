node-red-node-pushbullet
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://pushbullet.com" target="_new">Pushbullet</a>.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-pushbullet


Usage
-----

### Pushbullet output node

Uses PushBullet to push `msg.payload` to a device that has the PushBullet app installed.
* Optionally uses `msg.topic` to set the title, if not already set in the properties.
* Optionally uses `msg.pushtype` to set the type of the push, if not already set in the properties.
* Optionally uses `msg.deviceid` to set the device ID, if not already set in the properties.

You can also push to any channels that you own either configured or via `msg.channel`.

The node can also *dismiss* and *delete* any push and *update* items in a pushed list. In this case `msg.data.iden` must be set to a valid push id, if `msg` originates from the Pushbullet input node this value is already set.

### Pushbullet input node

Receives Pushbullets from all devices. Messages contain the following data:
* `msg.pushtype`: type of message
* `msg.topic`: topic information from the push
* `msg.payload`: main content of the push
* `msg.data`: original object from the pushbullet API containing e.g. sender, receiver and message ids.

Pushes of type <i>link</i> and <i>file</i> will also have `msg.message` containing the message associated with the push.

For further details of see <a href="https://docs.pushbullet.com/stream/">Pushbullet Stream API</a> and <a href="https://docs.pushbullet.com/v2/pushes/">Pushbullet Push API</a>.
