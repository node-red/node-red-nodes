node-red-node-multilang-sentiment
=================================

A <a href="http://nodered.org" target="new">Node-RED</a> node that scores incoming words
using the AFINN-165 wordlist and attaches a sentiment.score property to the msg.

This is similar to the default sentiment node but supports many more languages at the cost of using more disk space. (approx 11MB)

Install
-------

Either use the Menu - Manage palette - Install option in the editor or run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install node-red-node-multilang-sentiment


Usage
-----

Uses the AFINN-165 wordlist to attempt to assign scores to words in text.

Attaches `msg.sentiment` to the msg and within that `msg.sentiment.score` holds the score.

Supports multiple languages. These can be preselected in the node configuration. You can also set it so that `msg.lang` can be used to set the language dynamically if required. The cldr language codes supported are:

    af, am, ar, az, be, bg, bn, bs, ca, ceb, co, cs, cy, da, de, el, en, eo, es, et, eu, fa, fi,
    fr, fy, ga, gd, gl, gu, ha, haw, hi, hmn, hr, ht, hu, hy, id, ig, is, it, iw, ja, jw, ka, kk, km, kn, ko, ku, ky, la, lb, lo, lt,
    lv, mg, mi, mk, ml, mn, mr, ms, mt, my, ne, nl, no, ny, pa, pl, ps, pt, ro, ru, sd, si, sk, sl, sm, sn, so, sq, sr, st, su, sv,
    sw, ta, te, tg, th, tl, tr, uk, ur, uz, vi, xh, yi, yo, zh, zh-tw, zu

A score greater than zero is positive and less than zero is negative. The score typically ranges from -5 to +5, but can go higher and lower.

See the <a href="https://github.com/marcellobarile/multilang-sentiment/blob/develop/README.md" target="_blank">Multilang Sentiment docs here</a>.</p>
