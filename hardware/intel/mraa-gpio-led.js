module.exports = function(RED) {
    var m = require('mraa');
    function LEDNode(n) {
        RED.nodes.createNode(this, n);
        this.pin = Number(n.pin);
        this.led0 = new m.Led(0); /*user-led1-green*/
        this.led1 = new m.Led(1); /*user-led1-red*/
        this.led2 = new m.Led(2); /*user-led2-green*/
        this.led3 = new m.Led(3); /*user-led2-red*/
        this.on("input", function(msg) {
            if (msg.payload == "1") {
                switch(this.pin)
                {
                    case 0: /*User0 Led Green*/
                            this.led0.setBrightness(1);
                        break;
                    case 1: /*User0 Led Red*/
                            this.led1.setBrightness(1);
                        break;
                    case 2: /*User0 Orange*/
                            this.led0.setBrightness(1);
                            this.led1.setBrightness(1);
                        break;
                    case 3: /*User1 Led Green*/
                            this.led2.setBrightness(1);
                        break;
                    case 4: /*User1 Led Red*/
                            this.led3.setBrightness(1);
                        break;
                    case 5: /*User1 Orange*/
                            this.led2.setBrightness(1);
                            this.led3.setBrightness(1);
                        break;
                    default:
                        break;
                }
            }
            else {
                switch(this.pin)
                {
                    case 0: /*User1 Led Green*/
                            this.led0.setBrightness(0);
                        break;
                    case 1: /*User1 Led Red*/
                            this.led1.setBrightness(0);
                        break;
                    case 2: /*User1 Orange*/
                            this.led0.setBrightness(0);
                            this.led1.setBrightness(0);
                        break;
                    case 3: /*User2 Led Green*/
                            this.led2.setBrightness(0);
                        break;
                    case 4: /*User2 Led Red*/
                            this.led3.setBrightness(0);
                        break;
                    case 5: /*User2 Orange*/
                            this.led2.setBrightness(0);
                            this.led3.setBrightness(0);
                        break;
                    default:
                        break;
                }
            }
        });
        this.on('close', function() {
            this.led0.close();
            this.led1.close();
            this.led2.close();
            this.led3.close();
        });
    }
    RED.nodes.registerType("mraa-gpio-led", LEDNode);

    RED.httpAdmin.get('/mraa-gpio/:id', RED.auth.needsPermission('mraa-gpio.read'), function(req,res) {
        res.json(m.getPlatformType());
    });

    RED.httpAdmin.get('/mraa-version/:id', RED.auth.needsPermission('mraa-version.read'), function(req,res) {
        res.json(m.getVersion());
    });
}
