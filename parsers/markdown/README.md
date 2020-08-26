node-red-node-markdown
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to convert a markdown string to html.

Install
-------

Either use the `Node-RED Menu - Manage Palette - Install`, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-markdown

Usage
-----

If the input is a string it tries to convert it into an html string.

Uses the markdown-it library - You can see a demo <a href="https://markdown-it.github.io/" target="_new">here</a>.

It is configured with html, linkify and typographer options turned on.
