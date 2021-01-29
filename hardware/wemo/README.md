# node-red-node-wemo

A set of Node-RED nodes for working with Belkin WeMo devices.

These nodes use the uPnP discovery so may not discover your devices if you have a firewall enabled

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-wemo


## Output node

The output node switches a socket, a light or group of lights on or off

This should be backward compatible with the pervious version of this node but will benefit
from opening the config dialog and selecting the node you want.

The node accepts the following `msg.payload` as input

 * A single value
     * String : `on`/`off`
     * Integer : `1`/`0`
     * Boolean : `true`/`false`


 * A JSON Object as below (lights only and color control is still work in the progress)

 ```
    {
      state: 1,
      dim: 255,
      color: '255,255,255',
      temperature: 25000
    }
 ```

**Note**: Currently any invalid value is treated as an `off` command.

## Input Node

The new input node is now based on uPnP notifications instead of polling. This means messages
will only be set when an actual change occurs in on the device. This means the node will not
send regular no-change messages.

The output varies depending on the type of device but examples for sockets look like this:

```
   {
     "raw": "<e:propertyset xmlns:e=\"urn:schemas-upnp-org:event-1-0\">\n<e:property>\n<BinaryState>1</BinaryState>\n</e:property>\n</e:propertyset>\n\n\r",
     "state": "1",
     "sid": "uuid:e2c4586c-1dd1-11b2-8f61-b535035ae35d",
     "type": "socket",
     "name": "Bedroom Switch",
     "id": "221448K1100085"
   }
```

And a lightbulb can look like this:

```
   {
     "raw": "<e:propertyset xmlns:e=\"urn:schemas-upnp-org:event-1-0\">\n<e:property>\n<StatusChange>&lt;?xml version=&quot;1.0&quot; encoding=&quot;utf-8&quot;?&gt;&lt;StateEvent&gt;&lt;DeviceID\navailable=&quot;YES&quot;&gt;94103EA2B27803ED&lt;/DeviceID&gt;&lt;CapabilityId&gt;10006&lt;/CapabilityId&gt;&lt;Value&gt;1&lt;/Value&gt;&lt;/StateEvent&gt;\n</StatusChange>\n</e:property>\n</e:propertyset>\n\n\r",
     "id": "94103EA2B27803ED",
     "capability": "10006",
     "value": "1",
     "sid": "uuid:e2e5739e-1dd1-11b2-943d-c238ce2bad17",
     "type": "light",
     "name": "Bedroom"
   }
```

An Insight socket output can look like this:

```
  {
    "raw": "<e:propertyset xmlns:e=\"urn:schemas-upnp-org:event-1-0\">\n<e:property>\n<BinaryState>8|1454271649|301|834|56717|1209600|8|1010|638602|12104165</BinaryState>\n</e:property>\n</e:propertyset>\n\n\r",
    "state": "8",
    "onSince": 1611179325,
    "onFor": 2545,
    "onToday": 17432,
    "onTotal": 47939,
    "averagePower": 13,
    "power": 3.205,
    "energyToday": 3596536,
    "energyTotal": 9966151
    "sid": "uuid:ea808ecc-1dd1-11b2-9579-8e5c117d479e",
    "type": "socket",
    "name": "WeMo Insight",
    "id": "221450K1200F5C"
  }
```
Some information about those power parameters:
+ `state`: Whether the device is currently ON or OFF (1 or 0).
+ `onSince`: The date and time when the device was last turned on or off (as a Unix timestamp).
+ `onFor`: How long the device was last ON for (seconds).
+ `onToday`: How long the device has been ON today (seconds).
+ `onTotal`: How long the device has been ON total (seconds).
+ `timespan`: Timespan over which onTotal is relevant (seconds). Typically 2 weeks except when first started up.
+ `averagePower`: Average power consumption (Watts).
+ `power`: Current power consumption (Watts).
+ `energyToday`: Energy used today (Watt-hours, or Wh).
+ `energyTotal`: Energy used in total (Wh).
+ `standbyLimit`: Minimum energy usage to register the insight as switched on ( milliwats, default 8000mW, configurable via WeMo App).

## Lookup Node

This node queries the current state of a device, when an input message is injected.  The output is very similar to that of the Input node.
