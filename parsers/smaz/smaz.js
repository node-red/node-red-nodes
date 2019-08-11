
// Copyright (c) 2006-2009, Salvatore Sanfilippo
// All rights reserved.

// Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

// Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
// Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
// Neither the name of Smaz nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
// IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
// (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// Our compression codebook
var rc = [
 " ", "the", "e", "t", "a", "of", "o", "and", "i", "n", "s", "e ", "r", " th", " t", "in", "he", "th", "h", "he ", "to", "\r\n", "l", "s ", "d", " a", "an","er", "c", " o", "d ", "on", " of", "re", "of ", "t ", ", ", "is", "u", "at", "   ", "n ", "or", "which", "f", "m", "as", "it", "that", "\n", "was", "en", "  ", " w", "es", " an", " i", "\r", "f ", "g", "p", "nd", " s", "nd ", "ed ", "w", "ed", "http://", "for", "te", "ing", "y ", "The", " c", "ti", "r ", "his", "st", " in", "ar", "nt", ",", " to", "y", "ng", " h", "with", "le", "al", "to ", "b", "ou", "be", "were", " b", "se", "o ", "ent", "ha", "ng ", "their", "\"", "hi", "from", " f", "in ", "de", "ion", "me", "v", ".", "ve", "all", "re ", "ri", "ro", "is ", "co", "f t", "are", "ea", ". ", "her", " m", "er ", " p", "es ", "by", "they", "di", "ra", "ic", "not", "s, ", "d t", "at ", "ce", "la", "h ", "ne", "as ", "tio", "on ", "n t", "io", "we", " a ", "om", ", a", "s o", "ur", "li", "ll", "ch", "had", "this", "e t", "g ", "e\r\n", " wh", "ere", " co", "e o", "a ", "us", " d", "ss", "\n\r\n", "\r\n\r", "=\"", " be", " e", "s a", "ma", "one", "t t", "or ", "but", "el", "so", "l ", "e s", "s,", "no", "ter", " wa", "iv", "ho", "e a", " r", "hat", "s t", "ns", "ch ", "wh", "tr", "ut", "/", "have", "ly ", "ta", " ha", " on", "tha", "-", " l", "ati", "en ", "pe", " re", "there", "ass", "si", " fo", "wa", "ec", "our", "who", "its", "z", "fo", "rs", ">", "ot", "un", "<", "im", "th ", "nc", "ate", "><", "ver", "ad", " we", "ly", "ee", " n", "id", " cl", "ac", "il", "</", "rt", " wi", "div", "e, ", " it", "whi", " ma", "ge", "x", "&#x0", "\'>", "=\'"];

var cb = rc.reduce(function(result, item, index, array) {
    result[item] = index;
    return result;
}, {})

var smaz = module.exports = {
    codebook: cb,
    reverse_codebook: rc,
    flush_verbatim: function(verbatim) {
        var output = [];
        if (verbatim.length > 1) {
            output.push(255);
            output.push(verbatim.length-1);
        } else {
            output.push(254);
        }
        var k = 0;
        for (; k < verbatim.length; k++) {
            output.push(verbatim.charCodeAt(k));
        }
        return output;
    },

    compress: function(input) {
        var verbatim = "";
        var output = [];
        var input_index = 0;

        while (input_index < input.length) {
            // Try to lookup substrings into the hash table, starting from the
            // longer to the shorter substrings
            var encoded = false;
            var j = 7;

            if (input.length-input_index < 7) {
                j = input.length-input_index;
            }

            for (; j > 0; j--) {
                var code = smaz.codebook[input.substr(input_index,j)];
                if (code != undefined) {
                    // Match found in the hash table,
                    // Flush verbatim bytes if needed
                    if (verbatim) {
                        output = output.concat(smaz.flush_verbatim(verbatim));
                        verbatim = "";
                    }
                    // Emit the byte
                    output.push(code);
                    input_index += j;
                    encoded = true;
                    break;
                }
            }
            if (!encoded) {
                // Match not found - add the byte to the verbatim buffer
                verbatim += input[input_index];
                input_index++;
                // Flush if we reached the verbatim bytes length limit
                if (verbatim.length == 256) {
                    output = output.concat(smaz.flush_verbatim(verbatim));
                    verbatim = "";
                }
            }
        }
        // Flush verbatim bytes if needed
        if (verbatim) {
            output = output.concat(smaz.flush_verbatim(verbatim));
            verbatim = "";
        }
        return new Uint8Array(output);
    },

    decompress: function(input) {
        var output = "";
        var i = 0;
        while (i < input.length) {
            if (input[i] === 254) {
                // Verbatim byte
                if (i+1 >= input.length) {
                    throw "Malformed smaz.";
                }
                output += String.fromCharCode(input[i+1]);
                i += 2;
            } else if (input[i] === 255) {
                // Verbatim string
                var j;
                if (i+input[i+1]+2 >= input.length) {
                    throw "Malformed smaz.";
                }
                for (j = 0; j < input[i+1]+1; j++) {
                    output += String.fromCharCode(input[i+2+j]);
                }
                i += 3+input[i+1];
            } else {
                // Codebook entry
                output += smaz.reverse_codebook[input[i]];
                i++;
            }
        }
        return output;
    }
};
