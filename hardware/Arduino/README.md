node-red-node-arduino
=====================

This is a <a href="http://nodered.org" target="_new">Node-RED</a> Node module, to talk to an:
 - **Arduino:** running "standard Firmata" firmware 2.2+, or 
 - **ESP32:**   running "Configurable Firmata" 2.7+, or 
 - **Raspberry Pi Pico:** running "Configurable Firmata" 2.7+ firmware 

through serial port. 
_Typically plugged in to the host via USB to extend: I/O + analogue + I2C + OneWire + other Serial ports._

See the [main documentation](http://nodered.org/docs/hardware/arduino.html) for
details and examples of how to use this node.

See list of changes and latest features (with pictures) at: [NR's forum](https://discourse.nodered.org/t/announce-node-red-node-arduino-firmata-remastered-v1-3-3/96317). 


Install
-------

Either use the Menu - Manage Palette option,
or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm i --unsafe-perm node-red-node-arduino



Usage
-----

The Firmata firmware must be loaded to the Arduino/RpiPico/ESP32 board.
Recommended to use: [Configurable firmata](https://github.com/firmata/ConfigurableFirmata)

You can add a firmware-specific name to each board before flashing/uplading, if you insert this line at setup:
```
void setup() {
    // Set firmware name and version. Do this before initTransport(), because some client libraries expect that a reset sends this automatically.
    Firmata.setFirmwareNameAndVersion("ArduinoFirmata-42-spec-name", FIRMATA_PROTOCOL_MAJOR_VERSION, FIRMATA_FIRMWARE_MINOR_VERSION); 
  	initTransport();
```
This will help identify from console-log which board is using which port.

You may check the "Log to console" checkbox at board setup page. _(Default: Un-Checked.)_  
Use it on only at the beginning, for debugging errors.
Turn Logging OFF (uncheck) in production to reduce log size and increase speed.

### To view console Logs: 

 - If you started node-red in a consol, you will be able to see them there.
 - Otherwise type in a console/terminal:> `node-red-log`
  
Note: On node-red's right sidebar (in your browser window) only errors are visible.
  
Main Board Settings:
--------------------
These are hidden (non-visual) configuration Nodes called: **Arduino:** 
You can create a new ones, or choose from previously created. That will represent the chip or board connected.

**Note:** On Unix/linux systems, it is recommended to choose the COM port at **"by-id"** path, so it works always, no matter which USB port it gets plugged in.
    _(It will look like this: `/dev/serial/by-id/usb-Arduino_RaspberryPi_Pico_076461E62D414FE3-if00` )_


### Input Node

Connects to local board and monitors the selected pin for changes.
Sends the value as `msg.payload` and the pin number as `msg.topic` to the next Node.

- **Type:** You can select either **Digital**, **Pullup**, **Analogue**, or **String** input type.

- **Pin:** a number between 0 and the highest GPIO
    - **Warning:** Analogue pins are counted from 0 ! (Not the actual GPIO port.) For example RPi-Pico: [0,1,2,3] (and not 26-29,) where `A3` is the built-in Temp reader.


It only outputs **on a change** of the value.
That's fine for digital inputs, but you can get a lot of data from analogue pins which you must then handle. 
For example:
- you could use a `delay` node, set to rate limit and drop intermediate values, 
- or an `rbe` node to only report when it changes by a certain amount.

Also you can lower the reading rate by setting a higher:  **Sampling interval**. 
Default read rate is: 250ms = 4 message/second. 
You can change that at the config panel of the board or during runtime. But not individually per pin.


### Output Node

Connects to local board and writes to the selected pin.

You can select

 - **Digital** - accepts 0, 1, true, false, on, off
 - **Analogue** (PWM) - accepts Integer 0 to 255
 - **Servo** - accepts Integer 0 - 180
 - **String** - to send a *String* to the Arduino
 - **reset** - to reset the board, if `msg.payoload = true or 1`
 - **Sampling interval** - to set a new time (10ms - 65535ms) how fast analogue input data will be transfered
 
Digital, PWM, Servo will expects a value in `msg.payload`. 
The pin number must be set in the properties (config) panel before Deploy.

You can also send `msg.payoload = "reset"` to any Output Node without pre-configuring it, to reset the board.
 _(Reset will set all output pins to LOW, and will stop sending analogue values)_
_Note:_ it happens very fast. So if there is only a "LED blink", you will hardly notice anything, because "output" will work again after a few milliseconds.
Analogue read (and maybe digital in too!) will stop completely until flow restart.

*Note2* - some servos will not travel a full 180 degree range. _(Maybe only accepting 30 - 150 degrees for example.)_
Please use the `range` node to scale the input appropriately.


### Example

Simple flow to blink Pin: 13 (arduino LED). Change Pin to: 25 for RPi Pico LED

	[{"id":"2db61802.d249e8","type":"arduino out","z":"65fc95b26b02d8a1","name":"","pin":"13","state":"OUTPUT","arduino":"d7663aaf.47194","x":240,"y":80,"wires":[]},{"id":"38edc285adb170c9","type":"inject","z":"65fc95b26b02d8a1","name":"","props":[{"p":"payload"}],"repeat":"0.31","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"true","payloadType":"bool","x":89.5,"y":40,"wires":[["2db61802.d249e8"]]},{"id":"1e034bcd12c2bf12","type":"inject","z":"65fc95b26b02d8a1","name":"","props":[{"p":"payload"},{"p":"topic","vt":"str"}],"repeat":"0.91","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"false","payloadType":"bool","x":89.5,"y":80,"wires":[["2db61802.d249e8"]]},{"id":"00793c4da9c669e2","type":"comment","z":"65fc95b26b02d8a1","name":"Set Port first!","info":"","x":250,"y":40,"wires":[]},{"id":"d7663aaf.47194","type":"arduino-board","device":"","name":"Led-Test-board","samplingInt":"500","log2consol":true}]
