
var colours = {
    'aqua':'#00FFFF',
    'aliceblue':'#F0F8FF',
    'antiquewhite':'#FAEBD7',
    'black':'#000000',
    'off':'#000000',
    'blue':'#0000FF',
    'cyan':'#00FFFF',
    'darkblue':'#00008B',
    'darkcyan':'#008B8B',
    'darkgreen':'#006400',
    'darkturquoise':'#00CED1',
    'deepskyblue':'#00BFFF',
    'green':'#008000',
    'lime':'#00FF00',
    'mediumblue':'#0000CD',
    'mediumspringgreen':'#00FA9A',
    'navy':'#000080',
    'springgreen':'#00FF7F',
    'teal':'#008080',
    'midnightblue':'#191970',
    'dodgerblue':'#1E90FF',
    'lightseagreen':'#20B2AA',
    'forestgreen':'#228B22',
    'seagreen':'#2E8B57',
    'darkslategray':'#2F4F4F',
    'darkslategrey':'#2F4F4F',
    'limegreen':'#32CD32',
    'mediumseagreen':'#3CB371',
    'turquoise':'#40E0D0',
    'royalblue':'#4169E1',
    'steelblue':'#4682B4',
    'darkslateblue':'#483D8B',
    'mediumturquoise':'#48D1CC',
    'indigo':'#4B0082',
    'darkolivegreen':'#556B2F',
    'cadetblue':'#5F9EA0',
    'cornflowerblue':'#6495ED',
    'mediumaquamarine':'#66CDAA',
    'dimgray':'#696969',
    'dimgrey':'#696969',
    'slateblue':'#6A5ACD',
    'olivedrab':'#6B8E23',
    'slategray':'#708090',
    'slategrey':'#708090',
    'lightslategray':'#778899',
    'lightslategrey':'#778899',
    'mediumslateblue':'#7B68EE',
    'lawngreen':'#7CFC00',
    'aquamarine':'#7FFFD4',
    'chartreuse':'#7FFF00',
    'gray':'#808080',
    'grey':'#808080',
    'maroon':'#800000',
    'olive':'#808000',
    'purple':'#800080',
    'lightskyblue':'#87CEFA',
    'skyblue':'#87CEEB',
    'blueviolet':'#8A2BE2',
    'darkmagenta':'#8B008B',
    'darkred':'#8B0000',
    'saddlebrown':'#8B4513',
    'darkseagreen':'#8FBC8F',
    'lightgreen':'#90EE90',
    'mediumpurple':'#9370DB',
    'darkviolet':'#9400D3',
    'palegreen':'#98FB98',
    'darkorchid':'#9932CC',
    'yellowgreen':'#9ACD32',
    'sienna':'#A0522D',
    'brown':'#A52A2A',
    'darkgray':'#A9A9A9',
    'darkgrey':'#A9A9A9',
    'greenyellow':'#ADFF2F',
    'lightblue':'#ADD8E6',
    'paleturquoise':'#AFEEEE',
    'lightsteelblue':'#B0C4DE',
    'powderblue':'#B0E0E6',
    'firebrick':'#B22222',
    'darkgoldenrod':'#B8860B',
    'mediumorchid':'#BA55D3',
    'rosybrown':'#BC8F8F',
    'darkkhaki':'#BDB76B',
    'silver':'#C0C0C0',
    'mediumvioletred':'#C71585',
    'indianred':'#CD5C5C',
    'peru':'#CD853F',
    'chocolate':'#D2691E',
    'tan':'#D2B48C',
    'lightgray':'#D3D3D3',
    'lightgrey':'#D3D3D3',
    'thistle':'#D8BFD8',
    'goldenrod':'#DAA520',
    'orchid':'#DA70D6',
    'palevioletred':'#DB7093',
    'crimson':'#DC143C',
    'gainsboro':'#DCDCDC',
    'plum':'#DDA0DD',
    'burlywood':'#DEB887',
    'lightcyan':'#E0FFFF',
    'lavender':'#E6E6FA',
    'darksalmon':'#E9967A',
    'palegoldenrod':'#EEE8AA',
    'violet':'#EE82EE',
    'azure':'#F0FFFF',
    'honeydew':'#F0FFF0',
    'khaki':'#F0E68C',
    'lightcoral':'#F08080',
    'sandybrown':'#F4A460',
    'beige':'#F5F5DC',
    'mintcream':'#F5FFFA',
    'wheat':'#F5DEB3',
    'whitesmoke':'#F5F5F5',
    'ghostwhite':'#F8F8FF',
    'lightgoldenrodyellow':'#FAFAD2',
    'linen':'#FAF0E6',
    'salmon':'#FA8072',
    'oldlace':'#FDF5E6',
    'warmwhite':'#FDF5E6',
    'bisque':'#FFE4C4',
    'blanchedalmond':'#FFEBCD',
    'coral':'#FF7F50',
    'cornsilk':'#FFF8DC',
    'darkorange':'#FF8C00',
    'deeppink':'#FF1493',
    'floralwhite':'#FFFAF0',
    'fuchsia':'#FF00FF',
    'gold':'#FFD700',
    'hotpink':'#FF69B4',
    'ivory':'#FFFFF0',
    'lavenderblush':'#FFF0F5',
    'lemonchiffon':'#FFFACD',
    'lightpink':'#FFB6C1',
    'lightsalmon':'#FFA07A',
    'lightyellow':'#FFFFE0',
    'magenta':'#FF00FF',
    'mistyrose':'#FFE4E1',
    'moccasin':'#FFE4B5',
    'navajowhite':'#FFDEAD',
    'orange':'#FFA500',
    'orangered':'#FF4500',
    'papayawhip':'#FFEFD5',
    'peachpuff':'#FFDAB9',
    'pink':'#FFC0CB',
    'red':'#FF0000',
    'seashell':'#FFF5EE',
    'snow':'#FFFAFA',
    'tomato':'#FF6347',
    'white':'#FFFFFF',
    'yellow':'#FFFF00',
    'amber':'#FFD200'
};

var hexColour = /^#([0-9A-F][0-9A-F][0-9A-F]){1,2}$/i;
var r, g, b;

module.exports.getRGB = function(col,rgb) {
    if (!col) {
        return null;
    }
    if (/^\d{1,3},\d{1,3},\d{1,3}$/.test(col)) {
        return col;
    }
    col = col.toString().toLowerCase();
    if (col in colours) {
        col = colours[col];
    }
    if (hexColour.test(col)) {
        if (col.length === 4) {
            col = "#"+col[1]+col[1]+col[2]+col[2]+col[3]+col[3];
        }
        if (rgb === "grb") {
            g = parseInt(col.slice(1,3),16);
            r = parseInt(col.slice(3,5),16);
            b = parseInt(col.slice(5),16);
        }
        else {
            r = parseInt(col.slice(1,3),16);
            g = parseInt(col.slice(3,5),16);
            b = parseInt(col.slice(5),16);
        }
        return r+","+g+","+b;
    }
    else {
        return null;
    }
}

module.exports.getHex = function(col) {
    col = col.toString().toLowerCase();
    if (col in colours) {
        return colours[col];
    }
    else { return null; }
}

module.exports.HexRGB = function(hex) {
    try {
        r = parseInt(hex.slice(1,3),16);
        g = parseInt(hex.slice(3,5),16);
        b = parseInt(hex.slice(5),16);
        return r+","+g+","+b;
    }
    catch(e) { return null; }
}
