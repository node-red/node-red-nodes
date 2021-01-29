module.exports = function(RED) {
    "use strict";
    const pureimage = require("pureimage");
    const Readable = require("stream").Readable;
    const Writable = require("stream").Writable;
    const path = require("path");

    let fontLoaded = false;
    function loadFont() {
        if (!fontLoaded) {
            const fnt = pureimage.registerFont(path.join(__dirname,'./SourceSansPro-Regular.ttf'),'Source Sans Pro');
            fnt.load();
            fontLoaded = true;
        }
    }

    function AnnotateNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        const defaultFill = n.fill || "";
        const defaultStroke = n.stroke || "#ffC000";
        const defaultLineWidth = parseInt(n.lineWidth) || 5;
        const defaultFontSize = n.fontSize || 24;
        const defaultFontColor = n.fontColor || "#ffC000";
        loadFont();

        this.on("input", function(msg) {
            if (Buffer.isBuffer(msg.payload)) {
                if (msg.payload[0] !== 0xFF || msg.payload[1] !== 0xD8) {
                    node.error("Not a JPEG image",msg);
                } else if (Array.isArray(msg.annotations) && msg.annotations.length > 0) {
                    const stream = new Readable();
                    stream.push(msg.payload);
                    stream.push(null);
                    pureimage.decodeJPEGFromStream(stream).then(img => {
                        const c = pureimage.make(img.width, img.height);
                        const ctx = c.getContext('2d');
                        ctx.drawImage(img,0,0,img.width,img.height);

                        ctx.lineJoin = 'bevel';

                        msg.annotations.forEach(function(annotation) {
                            ctx.fillStyle = annotation.fill || defaultFill;
                            ctx.strokeStyle = annotation.stroke || defaultStroke;
                            ctx.lineWidth = annotation.lineWidth || defaultLineWidth;
                            ctx.lineJoin = 'bevel';
                            let x,y,r,w,h;

                            if (!annotation.type && annotation.bbox) {
                                annotation.type = 'rect';
                            }

                            switch(annotation.type) {
                                case 'rect':
                                    if (annotation.bbox) {
                                        x = annotation.bbox[0]
                                        y = annotation.bbox[1]
                                        w = annotation.bbox[2]
                                        h = annotation.bbox[3]
                                    } else {
                                        x = annotation.x
                                        y = annotation.y
                                        w = annotation.w
                                        h = annotation.h
                                    }

                                    if (x < 0) {
                                        w += x;
                                        x = 0;
                                    }
                                    if (y < 0) {
                                        h += y;
                                        y = 0;
                                    }
                                    ctx.beginPath();
                                    ctx.lineWidth = annotation.lineWidth || defaultLineWidth;
                                    ctx.rect(x,y,w,h);
                                    ctx.closePath();
                                    ctx.stroke();

                                    if (annotation.label) {
                                        ctx.font = `${annotation.fontSize || defaultFontSize}pt 'Source Sans Pro'`;
                                        ctx.fillStyle = annotation.fontColor || defaultFontColor;
                                        ctx.textBaseline = "top";
                                        ctx.textAlign = "left";
                                        //set offset value so txt is above or below image
                                        if (annotation.labelLocation) {
                                          if (annotation.labelLocation === "top") {
                                            y = y - (20+((defaultLineWidth*0.5)+(Number(defaultFontSize))));
                                            if (y < 0)
                                            {
                                              y = 0;
                                            }
                                          }
                                          else if (annotation.labelLocation === "bottom") {
                                            y = y + (10+h+(((defaultLineWidth*0.5)+(Number(defaultFontSize)))));
                                            ctx.textBaseline = "bottom";

                                          }
                                        }
                                        //if not user defined make best guess for top or bottom based on location
                                        else {
                                          //not enought room above imagebox, put label on the bottom
                                          if (y < 0 + (20+((defaultLineWidth*0.5)+(Number(defaultFontSize))))) {
                                            y = y + (10+h+(((defaultLineWidth*0.5)+(Number(defaultFontSize)))));
                                            ctx.textBaseline = "bottom";
                                          }
                                          //else put the label on the top
                                          else {
                                            y = y - (20+((defaultLineWidth*0.5)+(Number(defaultFontSize))));
                                            if (y < 0) {
                                              y = 0;
                                            }
                                          }
                                        }


                                        ctx.fillText(annotation.label, x,y);
                                    }
                                break;
                                case 'circle':
                                    if (annotation.bbox) {
                                        x = annotation.bbox[0] + annotation.bbox[2]/2
                                        y = annotation.bbox[1] + annotation.bbox[3]/2
                                        r = Math.min(annotation.bbox[2],annotation.bbox[3])/2;
                                    } else {
                                        x = annotation.x
                                        y = annotation.y
                                        r = annotation.r;
                                    }
                                    ctx.beginPath();
                                    ctx.lineWidth = annotation.lineWidth || defaultLineWidth;
                                    ctx.arc(x,y,r,0,Math.PI*2);
                                    ctx.closePath();
                                    ctx.stroke();
                                    if (annotation.label) {
                                        ctx.font = `${annotation.fontSize || defaultFontSize}pt 'Source Sans Pro'`;
                                        ctx.fillStyle = annotation.fontColor || defaultFontColor;
                                        ctx.textBaseline = "middle";
                                        ctx.textAlign = "center";
                                        ctx.fillText(annotation.label, x+2,y)
                                    }
                                break;
                            }
                        });
                        const bufferOutput = getWritableBuffer();
                        pureimage.encodeJPEGToStream(c,bufferOutput.stream,90).then(() => {
                            msg.payload = bufferOutput.getBuffer();
                            node.send(msg);
                        })
                    }).catch(err => {
                        node.error(err,msg);
                    })
                } else {
                    // No annotations to make - send the message on
                    node.send(msg);
                }
            } else {
                node.error("Payload not a Buffer",msg)
            }
            return msg;
        });
    }
    RED.nodes.registerType("annotate-image",AnnotateNode);



    function getWritableBuffer() {
        var currentSize = 0;
        var buffer = null;
        const stream = new Writable({
            write(chunk, encoding, callback) {
                if (!buffer) {
                    buffer = Buffer.from(chunk);
                } else {
                    var newBuffer = Buffer.allocUnsafe(currentSize + chunk.length);
                    buffer.copy(newBuffer);
                    chunk.copy(newBuffer,currentSize);
                    buffer = newBuffer;
                }
                currentSize += chunk.length
                callback();
            }
        });
        return {
            stream:  stream,
            getBuffer: function() {
                return buffer;
            }
        }
    }
}
