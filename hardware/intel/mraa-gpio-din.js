
module.exports = function(RED) {
    var m = require('mraa');
    //console.log("BOARD :",m.getPlatformName());

    function gpioDin(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.interrupt = n.interrupt;
        this.x = new m.Gpio(parseInt(this.pin));
        this.board = m.getPlatformName();
        var node = this;
        node.x.mode(m.PIN_GPIO);
        node.x.dir(m.DIR_IN);
        node.x.isr(m.EDGE_BOTH, function() {
            var g = node.x.read();
            var msg = { payload:g, topic:node.board+"/D"+node.pin };
            switch (g) {
                case 0: {
                    node.status({fill:"green",shape:"ring",text:"low"});
                    if (node.interrupt=== "f" || node.interrupt === "b") {
                        node.send(msg);
                    }
                    break;
                }
                case 1: {
                    node.status({fill:"green",shape:"dot",text:"high"});
                    if (node.interrupt=== "r" || node.interrupt === "b") {
                        node.send(msg);
                    }
                    break;
                }
                default: {
                    node.status({fill:"grey",shape:"ring",text:"unknown"});
                }
            }
        });
        switch (node.x.read()) {
            case 0: {
                node.status({fill:"green",shape:"ring",text:"low"});
                break;
            }
            case 1: {
                node.status({fill:"green",shape:"dot",text:"high"});
                break;
            }
            default: {
                node.status({});
            }
        }
        this.on('close', function() {
            node.x.isr(m.EDGE_BOTH, null);
        });
    }
    RED.nodes.registerType("mraa-gpio-din", gpioDin);
}
