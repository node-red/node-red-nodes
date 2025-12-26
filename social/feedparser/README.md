node-red-node-feedparser
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to read RSS and Atom feeds.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm install node-red-node-feedparser

Monitors an RSS/atom feed for new entries.

**Breaking change** - v1.0 - the node has been re-written to remove the use of the deprecated
request library - and now uses a different parsing library. As a result the returned data is 
slightly different and so the properties are not exactly as previous. 

### Outputs

 - topic - *string* - Title of article.
 - payload - *string* - Description of article.</dd>
 - link - *string* - URL link to article. 
- feed - *string* - Top level feed link, as configured.
 - article - *object* - Complete article object.
    
The <code>msg.article</code> property contains the complete article object,
       which has properties such as <code>.title</code>, <code>.description</code>,
       <code>.image</code> and so on.

If you select to return a single object - the only thing returned is the
        complete original response, which has different properties from those listed above.

You can set the polling time in minutes. Defaults to 15 minutes. The refresh interval cannot be greater than 35790 minutes (approx 24.8 days)
