node-red-node-annotate-image
==================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that can annotate
a JPEG image.

The node is currently limited to drawing rectangles and circles over the image.
That can be used, for example, to annotate an image with bounding boxes of features
detected in the image by a TensorFlow node.

Install
-------

Either use the Edit Menu - Manage Palette option to install, or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-annotate-image


Usage
-----

The JPEG image should be passed to the node as a Buffer object under `msg.payload`.

The annotations are provided in <code>msg.annotations</code> and are applied in order.

Each annotation is an object with the following properties:

 - `type` (*string*) : the type of the annotation - `rect` or `circle`
 - `x`/`y` (*number*) : the top-left corner of a `rect` annotation, or the center of a `circle` annotation.
 - `w`/`h` (*number*) : the width and height of a `rect` annotation
 - `r` (*number*) : the radius of a `circle` annotation
 - `bbox` (*array*) : this can be used instead of `x`, `y`, `w`, `h` and `r`.
   It should be an array of four values giving the bounding box of the annotation:
   `[x, y, w, h]`. If this property is set and `type` is not set, it will default to `rect`.
 - `label` (*string*) : an optional piece of text to label the annotation with
 - `stroke` (*string*) : the line color of the annotation. Default: `#ffC000`
 - `lineWidth` (*number*) : the stroke width used to draw the annotation. Default: `5`
 - `fontSize` (*number*) : the font size to use for the label. Default: `24`
 - `fontColor` (*string*) : the color of the font to use for the label. Default: `#ffC000`
 - `labelLocation` (*string*) : The location to place the label. `top` or `bottom`.
    If this propery is not set it will default to `automatic` and make the best guess based on location.


Examples
--------

```javascript
msg.annotations = [ {
    type: "rect",
    x: 10, y: 10, w: 50, h: 50,
    label: "hello"
}]
```
```javascript
msg.annotations = [
    {
        type: "circle",
        x: 50, y: 50, r: 20,
        lineWidth: 10

    },
    {
        type: "rect",
        x: 30, y: 30, w: 40, h: 40,
        stroke: "blue"
    }
]
```
```javascript
msg.annotations = [ {
    type: "rect",
    bbox: [ 10, 10, 50, 50]
}]
```
