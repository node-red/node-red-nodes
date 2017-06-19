node-red-node-snmp
==================

A pair of <a href="http://nodered.org" target="_new">Node-RED</a> nodes that
fetch either individual oids, or a table oid from a SNMP enabled host.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-snmp

Usage
-----

### snmp

SNMP oids fetcher. Can fetch a single or comma separated list of oids. Triggered by any input.

`msg.host` may contain the host.

`msg.community` may contain the community.

`msg.oid` may contain a comma separated list of oids to search for. (no spaces)

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oids configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing a table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-set

SNMP sets the value of one or more OIDs.

`msg.host` may contain the host.

`msg.community` may contain the community.

`msg.varbinds` may contain an array of varbind JSON objects e.g.:
```
    msg.varbinds = [
        {
            "oid": "1.3.6.1.2.1.1.5.0",
            "type": "OctetString",
            "value": "host1"
        }, {
            "oid": "1.3.6.1.2.1.1.6.0",
            "type": "OctetString",
            "value": "somewhere"
        }
    ];
```
Types can be:

 * `Boolean`
 * `Integer`
 * `OctetString`
 * `Null`
 * `OID`
 * `IpAddress`
 * `Counter`
 * `Gauge`
 * `TimeTicks`
 * `Opaque`
 * `Integer32`
 * `Counter32`
 * `Gauge32`
 * `Unsigned32`
 * `Counter64`
 * `NoSuchObject`
 * `NoSuchInstance`
 * `EndOfMibView`

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The varbinds configured in the edit config will override `msg.varbinds`. Leave blank if you want to use `msg.varbinds` to provide input.


 
### snmp-table

Simple SNMP table oid fetcher. Triggered by any input.

`msg.host` may contain the host.

`msg.community` may contain the community.

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oid configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-subtree

Simple SNMP oid subtree fetcher. Triggered by any input.

`msg.host` may contain the host.

`msg.community` may contain the community.

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oid configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-walker

Simple SNMP oid walker fetcher. Triggered by any input.

`msg.host` may contain the host.

`msg.community` may contain the community.

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oid configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.
