/**
 * OSC In Node
 * 接收 OSC 消息
 */

module.exports = function(RED) {
    function OscInNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        
        // 配置
        node.port = parseInt(config.port) || 9001;
        node.address = config.address || '/ventuz/*';
        node.multicast = (config.multicast || '').trim();
        node.iface = (config.iface || '').trim();
        
        // 状态
        node.listening = false;
        
        // 初始化 UDP socket
        var dgram = require('dgram');
        node.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        
        // OSC 解码函数
        function decodeOscString(buffer, offset) {
            var end = offset;
            while (end < buffer.length && buffer[end] !== 0) {
                end++;
            }
            var str = buffer.toString('utf-8', offset, end);
            var padding = (4 - (end - offset + 1) % 4) % 4;
            return { value: str, nextOffset: end + 1 + padding };
        }
        
        function decodeOscInt(buffer, offset) {
            return { value: buffer.readInt32BE(offset), nextOffset: offset + 4 };
        }
        
        function decodeOscFloat(buffer, offset) {
            return { value: buffer.readFloatBE(offset), nextOffset: offset + 4 };
        }
        
        function decodeOscBlob(buffer, offset) {
            var len = buffer.readUInt32BE(offset);
            var data = buffer.slice(offset + 4, offset + 4 + len);
            var padding = (4 - len % 4) % 4;
            
            // 检查是否是 BEUC 编码（中文）
            if (data.length >= 4 && data.slice(0, 4).toString('utf-8') === 'BEUC') {
                var unicodeBytes = data.slice(4);
                // 手动解码 UTF-16BE
                var str = '';
                for (var k = 0; k < unicodeBytes.length; k += 2) {
                    str += String.fromCharCode(unicodeBytes.readUInt16BE(k));
                }
                return { value: str, nextOffset: offset + 4 + len + padding };
            }
            
            return { value: data, nextOffset: offset + 4 + len + padding };
        }
        
        function decodeOscMessage(buffer) {
            var offset = 0;
            
            // 解析地址
            var addressResult = decodeOscString(buffer, offset);
            var address = addressResult.value;
            offset = addressResult.nextOffset;
            
            // 解析类型标签
            var typeResult = decodeOscString(buffer, offset);
            var typeTags = typeResult.value;
            offset = typeResult.nextOffset;
            
            // 解析参数
            var args = [];
            for (var i = 1; i < typeTags.length; i++) {
                var tag = typeTags[i];
                var result;
                
                switch (tag) {
                    case 'i':
                        result = decodeOscInt(buffer, offset);
                        args.push(result.value);
                        offset = result.nextOffset;
                        break;
                    case 'f':
                        result = decodeOscFloat(buffer, offset);
                        args.push(result.value);
                        offset = result.nextOffset;
                        break;
                    case 's':
                        result = decodeOscString(buffer, offset);
                        args.push(result.value);
                        offset = result.nextOffset;
                        break;
                    case 'b':
                        result = decodeOscBlob(buffer, offset);
                        args.push(result.value);
                        offset = result.nextOffset;
                        break;
                    default:
                        // 未知类型，跳过
                        break;
                }
            }
            
            return { address: address, args: args };
        }
        
        function decodeOscBundle(buffer) {
            // 检查 bundle 头
            if (buffer.length < 16) return null;
            var header = buffer.toString('utf-8', 0, 8);
            if (header !== '#bundle\x00') return null;
            
            var offset = 16; // 跳过 header 和 timetag
            var messages = [];
            
            while (offset < buffer.length) {
                if (offset + 4 > buffer.length) break;
                var msgLen = buffer.readUInt32BE(offset);
                offset += 4;
                
                if (offset + msgLen > buffer.length) break;
                var msgBuffer = buffer.slice(offset, offset + msgLen);
                offset += msgLen;
                
                var msg = decodeOscMessage(msgBuffer);
                if (msg) {
                    messages.push(msg);
                }
            }
            
            return messages;
        }
        
        // 绑定端口监听
        node.socket.bind(node.port, function() {
            node.listening = true;
            node.log('Listening for OSC messages on port ' + node.port);
            node.status({fill: "green", shape: "dot", text: "port " + node.port});
            
            // 启用广播接收
            node.socket.setBroadcast(true);
            
            // 如果配置了组播地址，加入组播组
            if (node.multicast && /^22[4-9]\.|^23[0-9]\./.test(node.multicast)) {
                try {
                    node.socket.addMembership(node.multicast, node.iface || undefined);
                    node.log('Joined multicast group: ' + node.multicast + (node.iface ? ' on interface ' + node.iface : ''));
                } catch (e) {
                    node.error('Failed to join multicast group: ' + e.message);
                }
            }
        });
        
        // 接收 OSC 消息
        node.socket.on('message', function(msg, rinfo) {
            try {
                var messages = [];
                
                // 尝试作为 bundle 解码
                if (msg.length >= 8 && msg.toString('utf-8', 0, 8) === '#bundle\x00') {
                    messages = decodeOscBundle(msg) || [];
                } else {
                    // 单条消息
                    var decoded = decodeOscMessage(msg);
                    if (decoded) {
                        messages = [decoded];
                    }
                }
                
                // 处理每条消息
                for (var i = 0; i < messages.length; i++) {
                    var oscMsg = messages[i];
                    
                    // 地址过滤
                    var addressPattern = node.address;
                    if (addressPattern !== '*' && addressPattern !== '/ventuz/*') {
                        var regexStr = '^' + addressPattern.replace(/\*/g, '.*').replace(/\//g, '\\/') + '$';
                        var regex = new RegExp(regexStr);
                        if (!regex.test(oscMsg.address)) {
                            continue; // 不匹配则忽略
                        }
                    }
                    
                    // 输出消息
                    node.send({
                        topic: oscMsg.address,
                        payload: oscMsg.args,
                        _ip: rinfo.address,
                        _port: rinfo.port,
                        _raw: msg
                    });
                }
                
            } catch (e) {
                node.error('OSC decoding error: ' + e.message);
            }
        });
        
        // 错误处理
        node.socket.on('error', function(err) {
            node.error('Socket error: ' + err.message);
            node.listening = false;
            node.status({fill: "red", shape: "ring", text: "error"});
        });
        
        // 节点关闭时清理
        node.on('close', function() {
            if (node.socket) {
                node.socket.close();
            }
            node.listening = false;
        });
    }
    
    RED.nodes.registerType("osc-in", OscInNode);
};
