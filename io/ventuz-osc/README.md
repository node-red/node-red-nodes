# node-red-contrib-ventuz-osc

Node-RED 节点，用于 Ventuz OSC 通信。

## 功能

- **osc-out**: 发送 OSC 消息到 Ventuz（支持中文 BEUC 编码）
- **osc-in**: 接收 Ventuz 广播的 OSC 消息

## 特性

- ✅ 完整的 OSC Bundle 支持
- ✅ 中文字符串自动 BEUC 编码
- ✅ 支持 int、float、string、blob 数据类型
- ✅ 通配符地址过滤
- ✅ 追踪发送方 IP/端口

## 安装

```bash
cd ~/.node-red
npm install node-red-contrib-ventuz-osc
```

或通过 Node-RED 管理面板搜索 `node-red-contrib-ventuz-osc` 安装。

## 节点说明

### osc-out 节点

发送 OSC 消息到指定目标。

**配置项：**
- **host**: 目标主机地址（默认 127.0.0.1）
- **port**: OSC 端口号（默认 9000）
- **address**: OSC 地址（默认 /ventuz/broadcast）

**输入消息格式：**
```json
{
  "topic": "/ventuz/broadcast",
  "payload": "Hello Ventuz"
}
```

**支持的数据类型：**
- 整数 (int32)
- 浮点数 (float32)
- 字符串 (UTF-8/BEUC)
- 布尔值 (自动转 int)
- Blob (Buffer)

### osc-in 节点

监听指定端口的 OSC 消息。

**配置项：**
- **port**: 监听端口号（默认 9001）
- **address**: OSC 地址过滤器（默认 /ventuz/*）

**输出消息格式：**
```json
{
  "topic": "/ventuz/broadcast",
  "payload": ["Hello", 123, 45.67],
  "_ip": "192.168.1.100",
  "_port": 12345,
  "_raw": "<Buffer>"
}
```

**地址过滤器示例：**
- `/ventuz/*` - 匹配所有 /ventuz/ 开头的地址
- `*` - 匹配所有地址
- `/ventuz/broadcast` - 精确匹配

## 示例

导入 `examples/osc-example.json` 中的示例流程。

## OSC 编码说明

本模块的 OSC 编码实现参考了 [c3812600/osc](https://github.com/c3812600/osc) 项目，支持：

- 标准 OSC 消息和 Bundle 格式
- 中文字符串 BEUC 编码（自动检测）
- 4 字节对齐填充

## License

MIT
