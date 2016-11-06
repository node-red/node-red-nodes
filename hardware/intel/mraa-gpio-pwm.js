
module.exports = function(RED) {
    var m = require('mraa');

    function gpioPWM(n) {
        RED.nodes.createNode(this, n);
        this.pin = Number(n.pin);
        this.period = Number(n.period) || 100;
        var node = this;
        node.p = new m.Pwm(node.pin);
        //node.p.dir(m.DIR_OUT);
        //node.p.mode(m.PIN_PWM);
        node.p.enable(true);
        node.p.period_ms(node.period);

        node.on("input", function(msg) {
            if (msg.payload) {
                node.p.write(Number(msg.payload));
            }
        });

        this.on('close', function() {
            node.p.enable(false);
        });
    }
    RED.nodes.registerType("mraa-gpio-pwm", gpioPWM);

    RED.httpAdmin.get('/mraa-gpio/:id', RED.auth.needsPermission('mraa-gpio.read'), function(req,res) {
        res.json(m.getPlatformType());
    });

    RED.httpAdmin.get('/mraa-version/:id', RED.auth.needsPermission('mraa-version.read'), function(req,res) {
        res.json(m.getVersion());
    });
}
