node-red-contrib-ldap
=====================

Basic LDAP search node

Takes base DN and filter

Filter is a Mustashe template that will match against the whole msg object

Bind is available

TLS seams to crash node so disabled for now

Depends on the LDAP npm module which uses the openldap libraries. Install with:

npm install LDAP

Only tested on Linux so far

