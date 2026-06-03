/**
 * OSC Out Node
 * 发送 OSC 消息到 Ventuz
 * 基于 Python OSC 编码实现，支持中文 BEUC 编码
 */

module.exports = function(RED) {
    function OscOutNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // 配置
        node.host = (config.host || '127.0.0.1').trim();
        node.port = parseInt(config.port) || 9000;
        node.address = config.address || '/ventuz/broadcast';
        node.iface = (config.iface || '').trim();
        
        // 状态
        node.connected = false;
        
        // 初始化 UDP socket
        var dgram = require('dgram');
        node.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        
        // 检测是否为组播/广播地址
        var isMulticast = /^22[4-9]\.|^23[0-9]\./.test(node.host);
        var isBroadcast = node.host.endsWith('.255') || node.host === '255.255.255.255';
        
        // 绑定 socket 后再设置广播（发送端不需要加入组播组）
        node.socket.bind(0, function() {
            try {
                if (isBroadcast) {
                    // 广播地址：启用广播
                    node.socket.setBroadcast(true);
                    node.log('Broadcast enabled');
                } else if (isMulticast) {
                    // 组播配置
                    node.socket.setMulticastLoopback(true);
                    node.socket.setMulticastTTL(128);
                    if (node.iface) {
                        node.socket.setMulticastInterface(node.iface);
                    }
                    node.log('Multicast mode: sending to ' + node.host + (node.iface ? ' via ' + node.iface : ''));
                }
            } catch (e) {
                node.error('Socket configuration error: ' + e.message);
            }
        });
        
        // OSC 编码函数
        function isContainsChinese(s) {
            for (var i = 0; i < s.length; i++) {
                if (s.charCodeAt(i) > 127) {
                    return true;
                }
            }
            return false;
        }
        
        function encodeOscString(s) {
            var encoded = Buffer.from(s, 'utf-8');
            var withNull = Buffer.concat([encoded, Buffer.from([0x00])]);
            var padding = (4 - withNull.length % 4) % 4;
            return Buffer.concat([withNull, Buffer.alloc(padding, 0x00)]);
        }
        
        function encodeOscInt(value) {
            var buf = Buffer.alloc(4);
            buf.writeInt32BE(value);
            return buf;
        }
        
        function encodeOscFloat(value) {
            var buf = Buffer.alloc(4);
            buf.writeFloatBE(value);
            return buf;
        }
        
        function padTo4(data) {
            var padding = (4 - data.length % 4) % 4;
            return Buffer.concat([data, Buffer.alloc(padding, 0x00)]);
        }
        
        function encodeOscBundle() {
            var elements = [];
            for (var i = 0; i < arguments.length; i++) {
                elements.push(arguments[i]);
            }
            
            var bundleHeader = Buffer.from('#bundle\x00', 'utf-8');
            var timetag = Buffer.alloc(8);
            timetag.writeUInt32BE(0, 0);
            timetag.writeUInt32BE(1, 4);
            
            var msg = Buffer.concat([bundleHeader, timetag]);
            
            for (var j = 0; j < elements.length; j++) {
                var elem = elements[j];
                var lenBuf = Buffer.alloc(4);
                lenBuf.writeUInt32BE(elem.length);
                msg = Buffer.concat([msg, lenBuf, elem]);
            }
            
            return msg;
        }
        
        function encodeOscElement(address, args) {
            var addressBytes = encodeOscString(address);
            var typeTags = ',';
            var data = Buffer.alloc(0);
            
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                
                if (typeof arg === 'boolean') {
                    typeTags += 'i';
                    data = Buffer.concat([data, encodeOscInt(arg ? 1 : 0)]);
                } else if (typeof arg === 'number') {
                    if (Number.isInteger(arg)) {
                        typeTags += 'i';
                        data = Buffer.concat([data, encodeOscInt(arg)]);
                    } else {
                        typeTags += 'f';
                        data = Buffer.concat([data, encodeOscFloat(arg)]);
                    }
                } else if (typeof arg === 'string') {
                    if (isContainsChinese(arg)) {
                        typeTags += 'b';
                        // 手动编码 UTF-16BE
                        var utf16beBytes = Buffer.alloc(arg.length * 2);
                        for (var k = 0; k < arg.length; k++) {
                            utf16beBytes.writeUInt16BE(arg.charCodeAt(k), k * 2);
                        }
                        var beucData = Buffer.concat([Buffer.from('BEUC', 'utf-8'), utf16beBytes]);
                        var beucLen = Buffer.alloc(4);
                        beucLen.writeUInt32BE(beucData.length);
                        data = Buffer.concat([data, beucLen, padTo4(beucData)]);
                    } else {
                        typeTags += 's';
                        data = Buffer.concat([data, encodeOscString(arg)]);
                    }
                } else {
                    var argStr = String(arg);
                    typeTags += 's';
                    data = Buffer.concat([data, encodeOscString(argStr)]);
                }
            }
            
            var typeTagBytes = encodeOscString(typeTags);
            return Buffer.concat([addressBytes, typeTagBytes, data]);
        }
        
        function sendOsc(address, args) {
            var element = encodeOscElement(address, args);
            var bundle = encodeOscBundle(element);
            
            try {
                node.socket.send(bundle, 0, bundle.length, node.port, node.host, function(err) {
                    if (err) {
                        node.error('Failed to send OSC message: ' + err.message);
                    } else {
                        node.log('Sent OSC: ' + address + ' -> ' + node.host + ':' + node.port);
                    }
                });
            } catch (e) {
                node.error('OSC send error: ' + e.message);
            }
        }
        
        // 处理输入消息
        node.on('input', function(msg) {
            if (!node.connected) {
                node.warn('Socket not ready');
                return;
            }
            
            var address = msg.topic || node.address;
            var payload = msg.payload;
            var args = [];
            
            // 解析 payload 为 OSC 参数
            if (Array.isArray(payload)) {
                args = payload;
            } else if (payload !== null && payload !== undefined) {
                args = [payload];
            }
            
            // 发送 OSC 消息
            sendOsc(address, args);
        });
        
        // 节点状态更新
        node.socket.on('error', function(err) {
            node.error('Socket error: ' + err.message);
            node.connected = false;
            node.status({fill: "red", shape: "ring", text: "error"});
        });
        
        // 标记为已连接
        node.connected = true;
        node.status({fill: "green", shape: "dot", text: node.host + ':' + node.port});
        
        // 节点关闭时清理
        node.on('close', function() {
            if (node.socket) {
                node.socket.close();
            }
            node.connected = false;
        });
    }
    
    RED.nodes.registerType("osc-out", OscOutNode);
};
