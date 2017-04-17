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

`msg.host` may contain the host, iff host not set in the node configuration.

`msg.community` may contain the community, iff community not set in the node configuration.

`msg.oid` may contain a comma separated list of oids to search for. (no spaces)

The host configured in the edit config will conflict with `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will conflict with `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oids configured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing a table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-table

Simple SNMP table oid fetcher. Triggered by any input.

`msg.host` may contain the host, iff host not set in the node configuration.

`msg.community` may contain the community, iff community not set in the node configuration.

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will conflict with `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will conflict with `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oid confgured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-subtree

Simple SNMP oid subtree fetcher. Triggered by any input.

`msg.host` may contain the host, iff host not set in the node configuration.

`msg.community` may contain the community, iff community not set in the node configuration.

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will conflict with `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will conflict with `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oid confgured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.

### snmp-walker

Simple SNMP oid walker fetcher. Triggered by any input.

`msg.host` may contain the host, iff host not set in the node configuration.

`msg.community` may contain the community, iff community not set in the node configuration.

`msg.oid` may contain the oid of a single table to search for.

The host configured in the edit config will conflict with `msg.host`. Leave blank if you want to use `msg.host` to provide input.

The community configured in the edit config will conflict with `msg.community`. Leave blank if you want to use `msg.community` to provide input.

The oid confgured in the edit config will override `msg.oid`. Leave blank if you
want to use `msg.oid` to provide input.

Outputs `msg.payload` containing the table of objects, and the requested `msg.oid`.
Values depends on the oids being requested.
