node-red-node-snmp
==================

A pair of <a href="http://nodered.org" target="_new">Node-RED</a> nodes that
fetch either individual oids, or a table oid from a SNMP enabled host.

Install
-------

Run the following command in the user directory of your Node-RED install.
( typically ~/.node-red )

    npm install node-red-node-snmp


Usage
-----

###snmp

SNMP oids fetcher. Can fetch a single or comma separated list of oids. Triggered by any input.

**msg.oid** may contain a comma separated list of oids to search for. (no spaces)

The oids confgured in the edit config will override msg.oid. Leave blank if you
want to use msg.oid to provide input.

Outputs **msg.payload** containing a table of objects. Values depends on the oids being requested.

###snmp-table

Simple SNMP table oid fetcher. Triggered by any input.

**msg.oid** may contain the oid of a single table to search for.

The oid confgured in the edit config will override msg.oid. Leave blank if you
want to use msg.oid to provide input.

Outputs **msg.payload** containing the table of objects. Values depends on the oids being requested.
