/* 
************************************************************
 This is a "Firmata protocol" based communication between 
 Node-RED and a connected board running firmata firmware.
 It is working with many boards, not just Arduino. 
 https://github.com/node-red/node-red-nodes
************************************************************

!How is it loading / running:
    1. First, the in/Out nodes will wait, until the "Main-board" = FirmataBoard is:
     - connecting
     - than getting the Version-info from board
     - after success -> those "child-Nodes" getting notified by this event: nodeIn.on(c_brdStateChanged, function() 
     - the firmware-level board name is getting stored at:  brdNode.FirmwareName
     See: Const BdStates ...  and ... function startBoardLoopTimer()
    
    1.2 If it fails, because of:
     - no board is set
     - no COM-port is set
     - could not connect to that COM-port.
    ... than it will:
     - write an error to the console-log
     - show error at NR UI sidebar.
     - Emit (send) a message (brotcast) to all [in+out] nodes to: show red dot under the node on UI

    2. After that, state of In/Out nodes will change only, if:
     - node is Closing
     - Board is Closing or Disconnected
     - reset signal sent
     - new interval sent

    3. TODO: periodically do a TEST to see, if the connection still lives?

! Warning:
    board.Ready gets true, once Firmata: version+capabilities finished reading. 

Firmata's: board.Pins[] array record structure:
{
    supportedModes: [ 0, 1, 3, 11, 16, [length]: 5 ],
    mode: 1,
    value: 0,
    report: 1,
    analogChannel: 127
}

settings: {
    reportVersionTimeout: 5000,
    samplingInterval: 19,                                               >> changed to 250ms
    serialport: { baudRate: 57600, highWaterMark: 256, path: 'COM3' }
}

transport.settings: {
    autoOpen: true,
    endOnClose: false,
    baudRate: 57600,    // TODO: test, if higher rate would also connect?
    path: 'COM3'
},

History: (v1.1+)
    https://github.com/node-red/node-red-nodes/issues/920#issuecomment-2709252741

TODO:
    - unplug-replug should restart everything
    - add samples

Todo: (later)
    - password Hash protection (periodic?)
    - flushDigitalPorts() = setting array of ports at once, not one-by-one
    - 1x queryPinState() vs. digitalRead() ... at startup? Need to investigate
        - digitalRead() adds a Listener
    - Firmware-Name: show board name on Node-RED panel, which was set at firmata firmware at startup: 
        get-name function?
    - update Baudrate during run via: transport.update() ... see: 

    new module name: red-firmata 
        - put / get functions
        - type identify by number, not string "ANALOG"

    RED.events.on('runtime-state', handleRuntimeState) in the onpalleteadd function.
        After the first time it detects obj.state === 'start'
    
Other ideas (later):

    - flushDigitalPorts() = setting array of ports at once, not one-by-one
    - queryPinState() vs. digitalRead() ... at startup? Need to investigate
    - Firmware-Name: show board name on Node-RED panel, which was set at firmata firmware at startup:
        void setup() {
            Firmata.setFirmwareNameAndVersion("my-unique-ArduinoFirmata-name-42", FIRMATA_PROTOCOL_MAJOR_VERSION, FIRMATA_FIRMWARE_MINOR_VERSION)`;

    - FindBy-Firmware-Name: use this name for auto-search this unique board at startup,
      no matter which serial-port is it plugged


Memo for debugging:
    if VSC not allowing to run: > node-red   (from JavaScript terminal), copy this first:
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
*/


module.exports = function(RED) {
    "use strict";
    const { SerialPort } = require('serialport'); // changed format SP -> to {SP} at v9 => v10. See: https://serialport.io/docs/guide-upgrade
    const firmataBoard = require('./lib/firmata');
    

    let moreLogs = RED.settings.verbose || false; // enable this for "debugging"

    // "global" constants:  (these are used at Emitters too)
    const c_fbr         = "  -- FirmataBoard:"; // this is used to print consol-log messages equally. 
    const c_ANALOG      = "ANALOG";
    const c_INPUT       = "INPUT" ;
    const c_PULLUP      = "PULLUP"; // also input, with resistor activated

    const c_OUTPUT      = "OUTPUT";
    const c_PWM         = "PWM"   ;
    const c_SERVO       = "SERVO" ;
    const c_SYSEX       = "SYSEX" ;
    const c_RESET       = "RESET" ;
    const c_INTER       = "INTERVAL";

    const c_STRING      = "STRING"; // used in both in+out node


	const c_invalidPin  = "Invalid pin: ";
    const c_brdStateChanged = "BrdStatCh"; // used by board-emitter + children's .on() Combined with BoardNode's    
    const c_brdReady        = "brdReady" ; // same as ^c_brdStateCh..

    // state types of the Firmata Board:
    const BdStates = Object.freeze({                // (freeze = immutable record)
        permanentError: -9,
        portNotSet    : -4, // no COM-port specified
        unknownError  : -3,
        disconnected  : -2,
        tryReconnect  : -1,
        start         :  0,
        connecting    :  1,
        gettingVersion:  2,
        OK            :  3 // Ready
    });

    const c_ring    = "ring"; 
    const c_dot     = "dot" ;
    const c_red     = "red"   ;
    const c_green   = "green" ;
    const c_yellow  = "yellow";
    const c_blue    = "blue"  ;
    const c_grey    = "grey"  ;
    
	// global error handling for uncaught errors:
    process.on('uncaughtException', (err, origin) => {
        const e = "!!! Unhandled error in: [35-arduino.js] node-red module.   >> " + err + "   >> ORIGIN: [%o]";
        try {
            this.error( e, origin );
        } catch (rrr) {      
            console.error( e, origin );
        }
    });


    RED.events.on("deploy", function() {    // sadly this is not getting triggered on DEPLOY button click :-(
        console.log(c_fbr + "MAIN - deploy happened!");  // manual says: "A new flow has been deployed"     https://nodered.org/docs/api/ui/events/
    });


	function resetBoard(_brdNode){
        if ((_brdNode == null) || (_brdNode.board == null)) return;
    //  console.log('pins: %o', nodeIn.board.analogPins);
        if (moreLogs) console.info(c_fbr + " Board RESET. Port= " + _brdNode.port ); // =parent.device
        try {
            _brdNode.board.reset();
            if (moreLogs) console.info(c_fbr + "  .. Reset sent. Port= " + _brdNode.port );
        }
        catch(err) {
            _brdNode.error(c_fbr + "sending: reset failed. Error: " + err);
        }			
    };


    // state types of Input/Output nodes:
    const ndStats = Object.freeze({                // (freeze = immutable record)
        noBoard       : -3, // no firmata Board specified
        wrongPin      : -2, // Error
        pinConflict   : -1, // Error: multiple nodes are set with same pin 
        start         :  0,
        equalsBoard   :  1, // the node will reflect it's parent-board's status. Like: "no COM port set"
        OK            :  3
    });

    function updateNodeStatus(_n, new_stat) {
        if (_n.parentNode == null) new_stat = ndStats.noBoard;

        if (((_n.parentNode != null) && (_n.parentNode.b_stat !== BdStates.OK)) 
            || (new_stat === ndStats.equalsBoard) ) // if the main board has some error, it has priority, Except: [noBoard, missingPin pinConflict]
        { 
            _n.n_status = ndStats.equalsBoard;
            switch (_n.parentNode.b_stat) {
                case BdStates.permanentError: _n.status({fill:c_red    , shape:c_ring, text:"Permanent Error: Board!"}); break;     // -9
                case BdStates.portNotSet    : _n.status({fill:c_red    , shape:c_ring, text:"Error: Port not set!"}); break;        // -4
                case BdStates.unknownError  : _n.status({fill:c_red    , shape:c_ring, text:"Unknown Error: Board!"}); break;       // -3
                case BdStates.disconnected  : _n.status({fill:c_red    , shape:c_ring, text:"Disconnected!"}); break;
                case BdStates.tryReconnect  : _n.status({fill:c_red    , shape:c_dot , text:"Try Reconnecting.."}); break;
                case BdStates.gettingVersion: _n.status({fill:c_blue   , shape:c_dot , text:"Getting name+version"}); break;
                case BdStates.connecting    : _n.status({fill:c_grey   , shape:c_dot , text:"node-red:common.status.connecting"}); break;
                default                     : _n.status({}); break;
            }
        }
        else {
            if (_n.n_status === new_stat) return;
            _n.n_status = new_stat;
            switch (new_stat) {
                case ndStats.noBoard       : _n.status({fill:c_red   , shape:c_ring, text:"Error: No Board!"}); break;      // -3
                case ndStats.wrongPin      : _n.status({fill:c_red   , shape:c_ring, text:"Error: Pin not set!"}); break;   // -2
                case ndStats.pinConflict   : _n.status({fill:c_red   , shape:c_ring, text:"Error: Pin Conflict!"}); break;  // -1
                case ndStats.start         : _n.status({fill:c_grey  , shape:c_ring, text:"...start"}); break;              //  0
            //  case ndStats.equalsBoard   : = 1
                case ndStats.OK            : _n.status({fill:c_green , shape:c_ring, text:"OK"}); break;                    // +3
                default                    : _n.status({}); break;
            }
        }
    }

    function pinAlreadyUsed (_parentNode, _newNode) { // Check, if there is already a Node registered with same pin -> report pin-conflict
        if (_parentNode.myChirdren.length === 0) return false;
        if (([c_RESET, c_STRING, c_SYSEX, c_INTER]).includes(_newNode.pinType)) return false;

        let _pin = _newNode.pin;
        if (_newNode.pinType === c_ANALOG) {
            if (_newNode.pin >= _parentNode.board.analogPins.length) return false; // wrong pin number
            _pin = _parentNode.board.analogPins[_newNode.pin]; // get from the reference Like: [26,27,28,29] _pin=3 -> _pin=29 
        }
        for (let i = 0; i < _parentNode.myChirdren.length; i++) {
            const _ch = _parentNode.myChirdren[i];
            if (_ch == null     ) continue;
            if (_ch === _newNode) continue; // itself

            function reportErrorAndExit() {
                updateNodeStatus(_newNode, ndStats.pinConflict);
                _newNode.error("This pin number is already in use by this Node:" + _newNode.id);
                return true;
            }

            if ( _ch.pinType === c_ANALOG) {
                if (_pin === _parentNode.board.analogPins[_ch.pin]) return reportErrorAndExit(); // found similar! Exit
            } else {
                if (_pin === _ch.pin) return reportErrorAndExit(); // found similar! Exit
            }
        }
        return false; // not found any pin-conflict
    }

    function removeFromChildren(_ch) {
        if (_ch != null) {
            let _x =_ch.parentNode.myChirdren.indexOf(_ch);
            if (_x >= 0) _ch.parentNode.myChirdren.splice(_x, 1);
        };
    };




/**
 *  The Board Definition - this opens (and closes) the connection. "n" contains the setup.
 */
    function ArduinoNode(_setup) {
        RED.nodes.createNode(this, _setup);
        let brdNode        = this;
        brdNode.b_stat     = BdStates.start;    // the status of the board
        brdNode.name       = _setup.name || "";
        brdNode.samplingInt= _setup.samplingInt || 200;
        if ((_setup.log2consol || moreLogs) === true) moreLogs = true;
        brdNode.port       = _setup.device || "";    // port path. Like: "COM3" or "/dev/serial/by-id/usb-Arduino_RaspberryPi_Pico_076461E62D414FE3-if00"
                                                // see also: "n.settings.serialport.path" . Sadly the original HTML is named it "device" :-(  
        brdNode.FirmwareName = "";
        brdNode.board        = null;    // the actual Firmata-Board
        brdNode.emitBaseStr  = "" + brdNode.id + "-"; // for generating unique string to emit + subcribe to it.
        brdNode.myChirdren   = [];
        brdNode.loop         = null;    // timer
        brdNode.loopWaitMs   = 0;       // How many millisecond to wait until re-trying. This will grow in time dynimically, up to: 10sec 
        brdNode.closing      = false;   //TODO: used to distinguish between normal close (true) or unwanted disconnection (cable / wifi)

        const startOptions = {
            samplingInterval: brdNode.samplingInt,
            serialport: { 
                baudRate: 57600,    // TODO:    test, if it would be possible to increase speed during run via fimata.Update()
                path : brdNode.port
            }
        };


        function updateBrdState(_newState) {
            if (brdNode.b_stat === _newState) return; // nothing changed -> exit
            brdNode.b_stat = _newState;
            // Send event to all nodeIn + nodeOut to update visual state
            for (let x = 0; x < brdNode.myChirdren.length; x++) {
                const _ch = brdNode.myChirdren[x];
                if (_ch != null)  _ch.emit(c_brdStateChanged, true);
            }
        }


        function startBoardLoopTimer() {
            if (brdNode.loop != null) return; // timer already set!
            if (brdNode.loopWaitMs < 10000) brdNode.loopWaitMs += (brdNode.loopWaitMs < 1500) ? 100 : 1000;
            brdNode.loop = setTimeout(function() { update_reconnect_MyBoard(); }, brdNode.loopWaitMs);
        }


        function update_reconnect_MyBoard() {
            clearTimeout(brdNode.loop); brdNode.loop = null;
            if (brdNode.board == null) return; // ... for any case
            if (brdNode.board.transport == null) return; // ... for any case

            const _t = brdNode.board.transport; // shorter form
            // if everything is fine. Startup already happened once, (and no disconnection since than,) so no need to run more times.
            if ((brdNode.b_stat === BdStates.OK) && (brdNode.board != null) && (brdNode.board.isReady) && (_t.isOpen)) {  
                if (moreLogs) console.info(c_fbr + " is already running fine. No need to start again. Port:" + brdNode.port );
// TODO: send a test: queryPinState(pin, callback)                
                brdNode.b_stat = BdStates.OK;
                brdNode.loopWaitMs = 0; // reset
                return;
            }

            let _newState = BdStates.connecting; // first time start
            if (brdNode.b_stat < 0) 
                _newState = BdStates.tryReconnect;
            else 
            if (!_t.opening && _t.isOpen && !brdNode.board.isReady)
                _newState = BdStates.gettingVersion; // first time start

            updateBrdState( _newState );
            if (!_t.opening && !_t.isOpen) // if not opening and not opened 
                _t.open();

            startBoardLoopTimer(); // increase time and check again
        }


        let startupBrd = function() {
            if ( brdNode.port === "") { // no port is set !
                updateBrdState(BdStates.portNotSet);
                return;
            }

            if (brdNode.board === null) {// if board does not exists yet ...
                brdNode.b_stat = BdStates.connecting; // first time start
                if (moreLogs) brdNode.log(c_fbr + "creating new instance. Port:" + brdNode.port + "  | Sampling-interval=" + brdNode.samplingInt);    

                // creating new board, starting async promice to report state changes:
                brdNode.board = new firmataBoard(brdNode.port, startOptions, function(e) {  // (port, options, callback)
                    if (e == null) { update_reconnect_MyBoard(); return; };

                    const _s = e.toString();
                    if (moreLogs) brdNode.log(c_fbr + brdNode.name + " Port:" + brdNode.port + " state changed to:" + _s
                        + "  |  opening:" + brdNode.board.transport.opening + "  | is open:" + brdNode.board.transport.isOpen);

                    // *** if some kind of error happened *** //
                    if ( (e.name === "Error") || (_s.indexOf("cannot open") !== -1) || (_s.indexOf("Error") !== -1)
                    ) {
                        updateBrdState(BdStates.permanentError);
                        brdNode.error(RED._("arduino.errors.portnotfound", {device:brdNode.port}));
                        brdNode.loopWaitMs = 20000;
                        startBoardLoopTimer();
                        return;
                    };

                    update_reconnect_MyBoard(); // this will update state, restart check-timer if needed.
                    //if (brdNode.board.versionReceived === true) updateBrdState(BdStates.OK)
                    //else                                        updateBrdState(BdStates.connecting);
                });
            }

            brdNode.board.transport.open();

            brdNode.on('destroy', function() {
                brdNode.closing = true;
                brdNode.myChirdren = [];
                if (brdNode.board == null) return; // exit
                brdNode.board.removeAllListeners('connect');
                brdNode.board.removeAllListeners('ready');
                brdNode.board.removeAllListeners('close');
                brdNode.board.removeAllListeners('disconnect');
            });

            // Firmata-board emitters:
            brdNode.board.on('error', function(err) {
                updateBrdState(BdStates.unknownError);
                if (moreLogs) brdNode.error(c_fbr + ' Error: ' + JSON.stringify(err) ); //+ 
            });

            // "connect" is called, once serial communication is established. After that queryFirmware is called. See: "ready"
            brdNode.board.on('connect', function() {
                brdNode.closing = false;
                if (moreLogs) brdNode.log(c_fbr + "connecting to:" + brdNode.port );
                if (brdNode.FirmwareName) // version already aquired once
                    updateBrdState(BdStates.OK);
                else {
                    if (brdNode.board.versionReceived) brdNode.warn("versionReceived but FirmwareName=[]");
                    updateBrdState(BdStates.gettingVersion);                            
                    startBoardLoopTimer();
                };
            });

            // "ready" event is called, after the Firmware name+version + capabilities got querried within 5000ms successfully 
            brdNode.board.on('ready', function() { 
                brdNode.closing = false;
                brdNode.FirmwareName = brdNode.board.firmware.name; 
                updateBrdState(BdStates.OK);
                brdNode.log(RED._("arduino.status.connected",{device:brdNode.port}) + 
                    "  Firmware name:[" + brdNode.FirmwareName + "]  " +
                    RED._("arduino.status.version",{version: brdNode.board.version.major +"."+ brdNode.board.version.minor}));
                // notifying all children
                for (let x = 0; x < brdNode.myChirdren.length; x++) {
                    const _ch = brdNode.myChirdren[x];
                    if (_ch != null)  _ch.emit(c_brdReady, true);
                }
            });

            brdNode.board.on('close', function(removed, done) {  // Firmata (transport) closing
// todo :  removed              
                updateBrdState(BdStates.disconnected);
                resetBoard(brdNode); // this will try to send a "last minute" signal to the board to: reset.
                if ( ! brdNode.closing) brdNode.error(RED._("arduino.status.portclosed"));
                if (done !== undefined) done();
            });

            brdNode.board.on('disconnect', function() {
                updateBrdState(BdStates.disconnected);
                if (moreLogs) brdNode.log(c_fbr + "Disconnected. Port:" + brdNode.port + "  Firmware Name: ["+ brdNode.FirmwareName +"]");    
                if ( ! brdNode.closing) startBoardLoopTimer(); // do not start, if proper closing is happening
            });
        };
//debugger


        // START board initialization the first time
        startupBrd();

        if (brdNode.loop == null) 
            startBoardLoopTimer();
        else
            if (moreLogs) brdNode.log(c_fbr + "already present. Loop start skipped. ");

//            brdNode.removeAllListeners('close');
        brdNode.on('close', function(removed, done) {  // the Node itself is getting destoyed     memo: function(done) did not work, TypeError
            brdNode.closing = true;
            if (!removed) updateBrdState(BdStates.disconnected); // this will notify clients too
            clearTimeout(brdNode.loop); brdNode.loop = null;
            if ((brdNode.board == null) || (brdNode.board.transport == null) ) {
                if (done !== undefined) done();
                return;
            } 

            if (brdNode.board.transport.closing) {
                if (moreLogs) { brdNode.log(c_fbr + "Nothing to do, because this port is already closing: " + brdNode.port); }    
                if (done !== undefined) done(); 
                return;// EXIT
            };

            if (moreLogs) { brdNode.log(c_fbr + "Trying to close port:" + brdNode.port); }
             
            if (brdNode.board.transport.isOpen) {
			    //resetBoard(brdNode);
                try {
                    brdNode.board.transport.close(function(err) {
                        if (moreLogs) { brdNode.log(RED._("arduino.status.portclosed") + err?"Err: ":"" , err); }
                    });
                    if (done !== undefined) done();
                }
                catch(e) { 
                    if (moreLogs) { brdNode.error("Could not close port: " + brdNode.port + (e?"Err: ":"") , e); }
                 }
            }
            else { if (done !== undefined) done(); return;}
        });
    }
    // *** REGISTERING the (parent) board node  *** //
    // ******************************************** //
    RED.nodes.registerType("arduino-board", ArduinoNode);


/**
 * The Input (child) Node
 *
 * pinType: can be ANALOG, DIGITAL ... (Warning! in html it is called "state")
 */
    function DuinoNodeIn(_setupIn) {
        RED.nodes.createNode(this, _setupIn); // n = setupNode
        let nodeIn          = this;
        nodeIn.n_status     = ndStats.start;
        nodeIn.pin          = _setupIn.pin;
        nodeIn.pinType      = _setupIn.state; // "state" is a wrong naming at the html definition. It is the current "Type" of the Pin. (Like: "ANALOG" or "PWM"...)
        nodeIn.parentNode   = RED.nodes.getNode(_setupIn.arduino); // n.arduino = The ArduinoNode's ID. It is defined at `package.json`: "node-red": {... "nodes": { "arduino": "35-arduino.js" }
        let loopIn = null; // timer

        // The creation process 
        if (typeof nodeIn.parentNode === "object") {
            nodeIn.frmBoard     = nodeIn.parentNode.board;      // a shorter reference the parent-node's Firmata-Board class
            if (nodeIn.frmBoard == null) {
                updateNodeStatus(nodeIn, ndStats.noBoard);
                return; // EXIT
            };

            nodeIn.parentNode.myChirdren.push(nodeIn);  // subscribe to main nodes array to recieve state changes
            // handle if parent Node's (= firmata-Board's) status is changed
            nodeIn.on(c_brdStateChanged, function() {
                updateNodeStatus(nodeIn, nodeIn.n_status);
            });

            // *** first initialization *** // 
            let startupIn = function() {
                if (moreLogs) console.info(c_fbr + "Node-In created." + (nodeIn.name ? "  Name=["+ nodeIn.name +"]" : "") + "  Pin=" + nodeIn.pin + "  Type=" + nodeIn.pinType);
                if (loopIn !== null) {clearTimeout(loopIn); loopIn = null};
                //nodeIn.frmBoard.setMaxListeners(0); Deleted 2025-03-17. DO NOT USE THIS ! See:  https://stackoverflow.com/a/44143119
//              nodeIn.frmBoard.setMaxListeners(11); // no need either
                nodeIn.oldval = "";
                updateNodeStatus(nodeIn, ndStats.equalsBoard);

                let doit = function() {
                    if (pinAlreadyUsed(nodeIn.parentNode, nodeIn) === true) return; // EXIT;         // pin-conflict check 
                    if (moreLogs) console.info(c_fbr + "Node-In init started." + (nodeIn.name ? "  Name=["+ nodeIn.name +"]" : "") + "  Pin=" + nodeIn.pin + "  Type=" + nodeIn.pinType);
					let goodPin = (nodeIn.pin != null) && !isNaN(nodeIn.pin) && (nodeIn.pin >=0) && (nodeIn.pin < nodeIn.frmBoard.pins.length);
					if (goodPin === true && nodeIn.pinType === c_ANALOG) {
						goodPin = ( nodeIn.pin in nodeIn.frmBoard.analogPins ); // found analogue pin
                        if (!goodPin){ nodeIn.error( c_invalidPin + nodeIn.pin 
                            + (nodeIn.frmBoard.analogPins ? ". Only these analogue pin numbers are allowed: [0.." 
                            + (nodeIn.frmBoard.analogPins.length-1) + "]/n Reference GPIOs:" + nodeIn.frmBoard.analogPins 
                            : "NO analogue pins are allowed with this firmware / board!"));
//console.log('pins: %o', nodeIn.board.analogPins);     // TESTS
//const jsonString = JSON.stringify(node.board.pins);
//console.log( jsonString );						
//node.error( jsonString ); // test
						}
					}
                    if (goodPin === true) {
                        try {
                            if (nodeIn.pinType === c_ANALOG) { nodeIn.frmBoard.pinMode(nodeIn.pin, 0x02); } else
                            if (nodeIn.pinType === c_INPUT ) { nodeIn.frmBoard.pinMode(nodeIn.pin, 0x00); } else
                            if (nodeIn.pinType === c_PULLUP) { nodeIn.frmBoard.pinMode(nodeIn.pin, 0x0B); }
                            updateNodeStatus(nodeIn, ndStats.OK);
                        } catch (setPinError) {
                            updateNodeStatus(nodeIn, ndStats.wrongPin);
                            nodeIn.error(c_fbr + "Input Pin ["+ nodeIn.pin +"] setting error:" + setPinError);
                            return;
                        }
                        
                        // subscribing to pin-event listeners. These will call at firmata-io.js:  board.addListener(`analog-read-${pin}`, callback);
                        if (nodeIn.pinType === c_ANALOG) {
                            nodeIn.frmBoard.analogRead(nodeIn.pin, function(v) {
                                if (nodeIn.n_status !== ndStats.OK) updateNodeStatus(nodeIn, ndStats.OK);
                                if (v !== nodeIn.oldval) {
                                    nodeIn.oldval = v;
                                    nodeIn.send({payload:v, topic:"A"+nodeIn.pin});
                                }
                            });
                        } else
                        if (nodeIn.pinType === c_INPUT) {
                            nodeIn.frmBoard.digitalRead(nodeIn.pin, function(v) {
                                if (nodeIn.n_status !== ndStats.OK) updateNodeStatus(nodeIn, ndStats.OK);
                                if (v !== nodeIn.oldval) {
                                    nodeIn.oldval = v;
                                    nodeIn.send({payload:v, topic:nodeIn.pin});
                                }
                            });
//                          nodeIn.frmBoard.queryPinState(nodeIn.pin, callback); // TODO ?
                        } else
                        if (nodeIn.pinType === c_PULLUP) {
                            nodeIn.frmBoard.digitalRead(nodeIn.pin, function(v) {
                                if (nodeIn.n_status !== ndStats.OK) updateNodeStatus(nodeIn, ndStats.OK);
                                if (v !== nodeIn.oldval) {
                                    nodeIn.oldval = v;
                                    nodeIn.send({payload:v, topic:nodeIn.pin});
                                }
                            });
//                          nodeIn.frmBoard.queryPinState(nodeIn.pin); // TODO ?
                        } else
                        if (nodeIn.pinType == c_STRING) {
                            nodeIn.frmBoard.on('string', function(v) {
                                if (nodeIn.n_status !== ndStats.OK) updateNodeStatus(nodeIn, ndStats.OK);
                            //  if (v !== nodeIn.oldval) { //OMG! deleted 2025-03-17
                            //      nodeIn.oldval = v;
                                    nodeIn.send({payload:v, topic:"string"});
                            //  }
                            });
                        };
                    }
                    else {
                        updateNodeStatus(nodeIn, ndStats.wrongPin);
                        nodeIn.error(c_fbr + " Input Node " + c_invalidPin + nodeIn.pin);
                    }
                }


                // wait first, until Board's capabilities are reported. Configure child node after that.
                if (nodeIn.frmBoard.isReady) { 
                    doit(); 
                } else {
                    nodeIn.once(c_brdReady, function() { 
                        doit();
                    }); 
                }
/*
                if (loopIn === null) {
                    if (moreLogs) console.info(c_fbr + "Timeout set for loop. Name="+ nodeIn.name + "  Pin=" + nodeIn.pin + "  State=" + nodeIn.pinType);
                    loopIn = setTimeout(function() { if (nodeIn.running === false) { startupIn(); } }, 4500);
                    loopIn.name = "startupIN-timeout";
                }
*/
            }
            startupIn();
        }
        else {
            updateNodeStatus(nodeIn, ndStats.noBoard);
            nodeIn.warn(c_fbr + "In: " + RED._("arduino.errors.portnotconf"));
        }

        nodeIn.on('close', function(removed, done) { // if remove === true -> it means this Node is getting deleted
            clearTimeout(loopIn);            
            if (removed) {removeFromChildren(nodeIn);}
            else         {updateNodeStatus(nodeIn, ndStats.equalsBoard);}
            if (done !== undefined) done();
        });
    }
    RED.nodes.registerType("arduino in", DuinoNodeIn);


/**
 * The Output (child) Node
 *
 * pinType: can be ANALOG, DIGITAL ... (Warning! in html "pinType" is called "state")
 */ 
    function DuinoNodeOut(_setupOut) {
        RED.nodes.createNode(this, _setupOut);
        let nodeOut         = this;
        nodeOut.n_status    = ndStats.start;
        nodeOut.pin         = _setupOut.pin;
        nodeOut.pinType     = _setupOut.state;  // "state" is a wrong naming at the html definition. It is the current type of the Pin. (Like: "ANALOG" or "PWM"...)
        nodeOut.parentNode  = RED.nodes.getNode(_setupOut.arduino); // _setupOut.arduino = The board config. It is defined at `package.json`: "node-red": {... "nodes": { "arduino": "35-arduino.js" }
        let loopOut = null; // timer

        // create an event-listener outside the scope of normal inputs, for "override-reset"
        if (nodeOut.pinType === c_RESET) {
            nodeOut.on("input", function(msg, send, done) {
                if ( Boolean(msg.payload) === true) {
                    try {
                        resetBoard(nodeOut.parentNode);
                        if (moreLogs) nodeOut.warn(c_fbr + "... sending reset from NR");                        
                    } catch (_error) {
                        nodeOut.error(c_fbr + "Could not send RESET to the board.", _error);
                    };
                    if (done !== undefined) done();
                }
            });
        }

// Test to see, what's inside:
//console.log("ou- _setupOut.arduino: %o", _setupOut.arduino);
//console.log("/n ====================================================================================== /n", n.arduino);
//console.log("ou- serverConfig: %o", nodeOut.boardConfig.board);
//console.log("/n ====================================================================================== /n", n.arduino);
//console.log("ou- type of serverConfig: " + typeof nodeOut.boardConfig);

        // The creation process 
        if (typeof nodeOut.parentNode === "object") { 
            nodeOut.frmBoard    = nodeOut.parentNode.board;     // a shorter reference directly to Firmata class
            if (nodeOut.frmBoard == null) {
                updateNodeStatus(nodeOut, ndStats.noBoard);
                return; // EXIT
            };

            nodeOut.parentNode.myChirdren.push(nodeOut);     // subscribe to main nodes array to recieve state changes
            // if parent Node's (= firmata-Board's) status is changed
            nodeOut.on(c_brdStateChanged, function() {
                updateNodeStatus(nodeOut, nodeOut.n_status);
            });

            let startupOut = function() {
                if (moreLogs) console.info(c_fbr + "Node-Out created." + (nodeOut.name ? "  Name=["+ nodeOut.name + "]" : "") + "  Pin=" + nodeOut.pin + "  Type=" + nodeOut.pinType);
                if (loopOut !== null) {clearTimeout(loopOut); loopOut = null};
                
                updateNodeStatus(nodeOut, ndStats.equalsBoard);
                
                let doit = function() {
                    if (pinAlreadyUsed(nodeOut.parentNode, nodeOut) === true) return; // EXIT;         // pin-conflict check 
                    if (moreLogs) console.info(c_fbr + "Node-Out init started." + (nodeOut.name ? "  Name=["+ nodeOut.name + "]" : "") + "  Pin=" + nodeOut.pin + "  Type=" + nodeOut.pinType);
                
                    if ((nodeOut.pin != null) && !isNaN(nodeOut.pin) && nodeOut.pin >=0 && nodeOut.pin < nodeOut.frmBoard.pins.length) {
                        if (nodeOut.pinType === c_OUTPUT) { nodeOut.frmBoard.pinMode(nodeOut.pin, 0x01); }
                        if (nodeOut.pinType === c_PWM   ) { nodeOut.frmBoard.pinMode(nodeOut.pin, 0x03); }
                        if (nodeOut.pinType === c_SERVO ) { nodeOut.frmBoard.pinMode(nodeOut.pin, 0x04); }
                
                        updateNodeStatus(nodeOut, ndStats.OK);
                        
                        nodeOut.on("input", function(msg, send, done) {
                            if ((msg == null) || (msg.payload == null)) {   // NULL input -> send warning & exit
                                nodeOut.warn("msg.payload must not be null!");
                                if (done !== undefined) done();
                                return;
                            }

                            if (nodeOut.frmBoard.isReady) {
                                if (msg.payload == "reset") {
                                    msg.payload = "";
                                    updateNodeStatus(nodeOut, ndStats.equalsBoard);
                                    resetBoard(nodeOut.parentNode);
                                } else
                                if (nodeOut.pinType === c_OUTPUT) {
                                    const str = msg.payload.toString();
                                    if ((msg.payload === true ) || (str === "1") || (str.toLowerCase() === "on")) {
                                        nodeOut.frmBoard.digitalWrite(nodeOut.pin, nodeOut.frmBoard.HIGH);
                                    } else
                                    if ((msg.payload === false) || (str === "0") || (str.toLowerCase() === "off")) {
                                        nodeOut.frmBoard.digitalWrite(nodeOut.pin, nodeOut.frmBoard.LOW);
                                    };
                                } else
                                if (nodeOut.pinType === c_PWM) {
                                    msg.payload = parseInt((msg.payload * 1) + 0.5); // round to int
                                    if ((msg.payload >= 0) && (msg.payload <= 255)) {
                                        nodeOut.frmBoard.analogWrite(nodeOut.pin, msg.payload);
                                    } else nodeOut.warn("PWM value must be: 0..255");
                                } else
                                if (nodeOut.pinType === c_SERVO) {
                                    msg.payload = parseInt((msg.payload * 1) + 0.5);
                                    if ((msg.payload >= 0) && (msg.payload <= 180)) {
                                        nodeOut.frmBoard.servoWrite(nodeOut.pin, msg.payload);
                                    }  else nodeOut.warn("PWM value must be: 0..180");
                                } else
                                if (nodeOut.pinType === c_SYSEX) {
                                    nodeOut.frmBoard.sysexCommand(msg.payload);
                                } else
                                if (nodeOut.pinType === c_STRING) {
                                    nodeOut.frmBoard.sendString(msg.payload.toString());
                                } else
/*                              if (nodeOut.pinType === c_RESET) {
                                    if ( Boolean(msg.payload) === true) {
                                        updateNodeStatus(nodeOut, ndStats.equalsBoard);
                                        resetBoard(nodeOut.parentNode);
                                    }
                                } else */
                                if (nodeOut.pinType === c_INTER) {
                                    const i = 0 + msg.payload;
                                    if (i < 10 || i > 65535) {
                                        nodeOut.warn("Invalid new interval input value (10-65535): ["+ msg.payload +"]");
                                        return;
                                    };
                                    nodeOut.samplingInterval = i;
                                    nodeOut.frmBoard.setSamplingInterval(i); 
                                    nodeOut.status({fill:c_yellow, shape:c_ring, text:"Interval= " + i});
                                }
                            }
                            if (done !== undefined) done();
                        });
                    }
                    else {
                        updateNodeStatus(nodeOut, ndStats.wrongPin);
                        nodeIn.error(c_fbr + " Output Node " + c_invalidPin + nodeOut.pin);
                    }
                }

                if (nodeOut.frmBoard.isReady) { 
                    doit(); 
                } else {
                    nodeOut.once(c_brdReady, function() { 
                        doit();
                    }); 
                }
/*
                if (loopOut === null) {
                    if (moreLogs) console.info(c_fbr + "Timeout set for loop. Name="+ nodeOut.name +"  Pin=" + nodeOut.pin + "  Type=" + nodeOut.type);
                    loopOut = setTimeout(function() { if (nodeOut.running === false) { startupOut(); } }, 4500);
                    loopOut.name = "startupOut-timeout";
                }
*/
            }
            startupOut();
        }
        else {
            updateNodeStatus(nodeOut, ndStats.noBoard);    
            nodeOut.warn(c_fbr + "Out: " + RED._("arduino.errors.portnotconf"));
        }

        nodeOut.on('close', function(removed, done) { // if remove === true -> it means this Node is getting deleted
            clearTimeout(loopOut);
            if (removed === true) {removeFromChildren(nodeOut);}
            else                  {updateNodeStatus(nodeOut, ndStats.equalsBoard);};
            if (done !== undefined) done();
        });
    }
    RED.nodes.registerType("arduino out", DuinoNodeOut);


/**
 * Listing serial ports (used at Board-configuration, by clicking the SEARCH button on the right side of port editbox)
 *
 */ 
    RED.httpAdmin.get("/arduinoports", RED.auth.needsPermission("arduino.read"), function(req, res) {
/*

        (async () => {
          try {
            const serialList = await SerialPort.list();
            ports => {
                const a = ports.map(p => p.comName);
                res.json(a);
                this.log(c_fbr + "Serial ports list:", a);
            },
            err => {
                this.error('Error listing serial ports', err);
            }
          } catch (e) {
            console.log(e);
          }
        })();
*/
// Firmata Example (not working ! because SerialPort changed to async) : https://github.com/yokobond/firmata-io#with-a-transport-instance

    let _arr = ["-- no ports found --"]; 
    async function listSerialPorts() {
        try {
            const ports = await SerialPort.list();
            console.log('Available Ports:', ports);
            if ((ports != null) && (Array.isArray(ports)) && ports.length !== 0) 
                _arr = ports.map(p => p.path);
            res.json(_arr);
        } catch (err) {
            console.error('Error listing ports:', err);
            _arr.push( err.toString );
            res.json(_arr);
        }
    }

    listSerialPorts();

/*
Expected result of each port in the array:
    interface PortInfo {
        path: string;
        manufacturer: string | undefined;
        serialNumber: string | undefined;
        pnpId: string | undefined;
        locationId: string | undefined;
        productId: string | undefined;
        vendorId: string | undefined;
    }

For example on windows:
[
  {
    path: 'COM3',
    manufacturer: 'Microsoft',
    serialNumber: '6&35CA52AB&0&0000',
    pnpId: 'USB\\VID_2E8A&PID_00C0&MI_00\\6&35CA52AB&0&0000',
    locationId: '0000.0014.0000.001.000.000.000.000.000',
    friendlyName: 'Soros USB-eszköz (COM3)',
    vendorId: '2E8A',
    productId: '00C0'
  }
]
*/
    });
}
