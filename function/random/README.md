node-red-node-random
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that when triggered generates a random number between two values.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-random


Usage
-----

A simple node to generate a random number when triggered.

If integer mode is selected (default) it will return an integer **between and including** the two values given - so selecting 1 to 6 will return values 1,2,3,4,5 or 6.

If floating point mode is selected then it will return a number **between** the two values given - so selecting 1 to 6 will return values 1 < x < 6 .

**Note:** This generates **numbers**.
