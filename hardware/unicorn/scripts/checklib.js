#!/usr/bin/env node
var fs =  require('fs');

if (!fs.existsSync('/usr/local/lib/python2.7/dist-packages/unicornhat.py')) {
    console.warn("WARNING : Can't find unicorn.py python library");
    console.warn("WARNING : Please install using the following command");
    console.warn("WARNING : Note: this uses root...");
    console.warn("WARNING :    curl -sS get.pimoroni.com/unicornhat | bash\n");
    //process.exit(1);
}
else {
    console.log("Unicorn Hat Python library found OK.\n")
}
