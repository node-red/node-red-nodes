
module.exports = function(RED) {
    var m = require('mraa');
    //console.log("BOARD :",m.getPlatformName());

    function gpioDin(n) {
        RED.nodes.createNode(this,n);
        this.pin = n.pin;
        this.interrupt = n.interrupt;
        this.mode = n.mode;
        this.initialMsg = n.initial;
        this.x = new m.Gpio(parseInt(this.pin));
        this.board = m.getPlatformName();
        this.defaultTimeout = 100;
        var node = this;
        node.x.mode(parseInt(this.mode));
        node.x.dir(m.DIR_IN);

        var eventHandler = function(g) {
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
        }

        var isrCallback = function() {
            eventHandler(node.x.read());
        }

        node.x.isr(m.EDGE_BOTH, isrCallback);
        var initialState = node.x.read();
        switch (initialState) {
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

        if (this.initialMsg) {
            setTimeout(() => {
                node.send( { payload: node.x.read(), topic:node.board+"/D"+node.pin } );
            }, this.defaultTimeout);
        }

        this.on('close', function() {
            node.x.isr(m.EDGE_BOTH, null);
            node.x.isrExit();
            node.x.close();
        });
    }
    RED.nodes.registerType("mraa-gpio-din", gpioDin);
}
