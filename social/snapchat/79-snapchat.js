// Require main module
var RED = require(process.env.NODE_RED_HOME+"/red/red");
var snapchat = require('snapchat'),
client = new snapchat.Client(),
fs = require('fs');



function SnapChatAccountNode(n) {
RED.nodes.createNode(this,n);
this.username = n.username;
this.password = n.password;
}



function SnapChatNode(n) {
 // Create a RED node
RED.nodes.createNode(this,n);
var node = this;

this.account = n.account;
this.path = n.path;
this.accountConfig = RED.nodes.getNode(this.account);
this.username = this.accountConfig.username;
this.password = this.accountConfig.password;


this.on("input",function(){

// Make sure the images folder exists
if(!fs.existsSync(this.path)) {
    fs.mkdirSync(this.path);
}

var path = this.path;
var msg ={};
msg.snaps =[];
client.login(this.username, this.password).then(function(data){
msg.payload = data.snaps.length;
data.snaps.forEach(function(snap){
      if (snap.st == 1 && typeof snap.t !== 'undefined')
      {
                var full_path = path + snap.id + '.jpg';
                var snapObject = {Sender:snap.sn,Path:full_path,SnapId:snap.id};
                msg.snaps.push(snapObject);

              var stream = fs.createWriteStream(full_path, { flags: 'w', encoding: null, mode: 0666});
              client.getBlob(snap.id).then(function(blob){
              blob.pipe(stream);
              blob.resume();
              });
      }

});
client.clear();
node.send(msg);

});

});

}

// Register the node by name. This must be called before overriding any of the
// Node functions.
RED.nodes.registerType("Snap Chat",SnapChatNode);
RED.nodes.registerType("snapchat-account",SnapChatAccountNode);
