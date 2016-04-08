# node-red-contrib-nodes-wemo

A set of Node-RED nodes for working with Belkin WeMo devices.

These nodes use the uPnP discovery so may not discover your devices if you have a firewall enabled

## Output node

The output node switches a socket, a light or group of lights on or off

This should be backward compatible with the pervious version of this node but will benefit 
from opening the config dialog and selecting the node you want.

The node accecpts the following inputs

 * Strings on/off
 * integers 1/0
 * boolean true/false
 * an Object like this (lights only, coming soon) 
 ```
    {
      state: 1,
      dim: 255,
      color: '255,255,255',
      temperature: 25000
    }
 ```

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

And a lightblub can look like this:

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

Insight

```
  {
    "raw": "<e:propertyset xmlns:e=\"urn:schemas-upnp-org:event-1-0\">\n<e:property>\n<BinaryState>8|1454271649|301|834|56717|1209600|8|1010|638602|12104165</BinaryState>\n</e:property>\n</e:propertyset>\n\n\r", 
    "state": "8", 
    "power": 1.01, 
    "sid": "uuid:ea808ecc-1dd1-11b2-9579-8e5c117d479e", 
    "type": "socket", 
    "name": "WeMo Insight", 
    "id": "221450K1200F5C" 
  }
```
