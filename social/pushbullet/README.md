node-red-node-pushbullet
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to send alerts via <a href="http://pushbullet.com" target="_new">Pushbullet</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-pushbullet


Usage
-----
### Pushbullet output node
Uses PushBullet to push <code>msg.payload</code> to a device that has the PushBullet app installed.
* Optionally uses <code>msg.topic</code> to set the title, if not already set in the properties.
* Optionally uses <code>msg.pushtype</code> to set the type of the push, if not already set in the properties.
* Optionally uses <code>msg.deviceid</code> to set the device ID, if not already set in the properties.

You can also push to any channels that you own either configured or via <code>msg.channel</code>.

The node can also *dismiss* and *delete* any push and *update* items in a pushed list. In this case <code>msg.data.iden</code> must be set to a valid push id, if <code>msg</code> originates from the Pushbullet input node this value is already set.

### Pushbullet input node
Receives Pushbullets from all devices. Messages contain the following data:
* <code>msg.pushtype</code>: type of message
* <code>msg.topic</code>: topic information from the push
* <code>msg.payload</code>: main content of the push
* <code>msg.data</code>: original object from the pushbullet API containing e.g. sender, receiver and message ids.

Pushes of type <i>link</i> and <i>file</i> will also have <code>msg.message</code> containing the message associated with the push.

For further details of see <a href="https://docs.pushbullet.com/stream/">Pushbullet Stream API</a> and <a href="https://docs.pushbullet.com/v2/pushes/">Pushbullet Push API</a>.
