node-red-node-snmp
==================

A set of <a href="http://nodered.org" target="_new">Node-RED</a> nodes that
fetch values from SNMP enabled hosts. Supports v1, v2c and v3.
* SNMP get - Simple SNMP oid or oid list fetcher
* SNMP set - Simple snmp Set node.
* SNMP subtree - Simple sub tree fetcher
* SNMP table - Simple SNMP oid table fetcher
* SNMP walker - Simple SNMP oid walker fetcher

## v2 Breaking Change
v2 has a breaking change in that the single snmp node no longer tries to stringify an octet string type (04). This makes it consistent with the other nodes in this bundle. this means the user now has to convert to a string if required but has better control of how they wish to do that.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-snmp

Usage
-----

### snmp

SNMP oids fetcher. Can fetch a single or comma separated list of oids. Triggered by any input.

`msg.host` may contain the host including the port.

`msg.community` may contain the community. (v1 and v2c only)

`msg.username` may contain the username. (v3 only)

`msg.authkey` may contain the digest security key. (v3 only)

`msg.privkey` may contain the encryption security key. (v3 only)

`msg.oid` may contain a comma separated list of oids to search for. (no spaces)

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The username configured in the edit config will override `msg.username`. Leave blank if you want to use `msg.username` to provide input.

The digest security key configured in the edit config will override `msg.authkey`. Leave blank if you want to use `msg.authkey` to provide input.

The encryption security key configured in the edit config will override `msg.privkey`. Leave blank if you want to use `msg.privkey` to provide input.

The oids configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing a table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-set

SNMP sets the value of one or more OIDs.

`msg.host` may contain the host including the port.

`msg.community` may contain the community. (v1 and v2c only)

`msg.username` may contain the username. (v3 only)

`msg.authkey` may contain the digest security key. (v3 only)

`msg.privkey` may contain the encryption security key. (v3 only)

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

The username configured in the edit config will override `msg.username`. Leave blank if you want to use `msg.username` to provide input.

The digest security key configured in the edit config will override `msg.authkey`. Leave blank if you want to use `msg.authkey` to provide input.

The encryption security key configured in the edit config will override `msg.privkey`. Leave blank if you want to use `msg.privkey` to provide input.

The varbinds configured in the edit config will override `msg.varbinds`. Leave blank if you want to use `msg.varbinds` to provide input.


 
### snmp-table

Simple SNMP table oid fetcher. Triggered by any input.

`msg.host` may contain the host including the port.

`msg.community` may contain the community. (v1 and v2c only)

`msg.username` may contain the username. (v3 only)

`msg.authkey` may contain the digest security key. (v3 only)

`msg.privkey` may contain the encryption security key. (v3 only)

`msg.oid` may contain a comma separated list of oids to search for. (no spaces)

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The username configured in the edit config will override `msg.username`. Leave blank if you want to use `msg.username` to provide input.

The digest security key configured in the edit config will override `msg.authkey`. Leave blank if you want to use `msg.authkey` to provide input.

The encryption security key configured in the edit config will override `msg.privkey`. Leave blank if you want to use `msg.privkey` to provide input.

The oid configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-subtree

Simple SNMP oid subtree fetcher. Triggered by any input. Reads from OID specified and any below it.

`msg.host` may contain the host including the port.

`msg.community` may contain the community. (v1 and v2c only)

`msg.username` may contain the username. (v3 only)

`msg.authkey` may contain the digest security key. (v3 only)

`msg.privkey` may contain the encryption security key. (v3 only)

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The username configured in the edit config will override `msg.username`. Leave blank if you want to use `msg.username` to provide input.

The digest security key configured in the edit config will override `msg.authkey`. Leave blank if you want to use `msg.authkey` to provide input.

The encryption security key configured in the edit config will override `msg.privkey`. Leave blank if you want to use `msg.privkey` to provide input.

The oid configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-walker

Simple SNMP oid walker fetcher. Triggered by any input. Reads from OID specified to the end of the table.

`msg.host` may contain the host including the port.

`msg.community` may contain the community. (v1 and v2c only)

`msg.username` may contain the username. (v3 only)

`msg.authkey` may contain the digest security key. (v3 only)

`msg.privkey` may contain the encryption security key. (v3 only)

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will override `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will override `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The username configured in the edit config will override `msg.username`. Leave blank if you want to use `msg.username` to provide input.

The digest security key configured in the edit config will override `msg.authkey`. Leave blank if you want to use `msg.authkey` to provide input.

The encryption security key configured in the edit config will override `msg.privkey`. Leave blank if you want to use `msg.privkey` to provide input.

The oid configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.
