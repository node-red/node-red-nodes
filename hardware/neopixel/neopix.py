#!/usr/bin/python

# Import library functions we need
import sys
import time
try:
    from rpi_ws281x import __version__, PixelStrip, Adafruit_NeoPixel, Color
except ImportError:
    from neopixel import Adafruit_NeoPixel as PixelStrip, Color
    __version__ = "legacy"

try:
    raw_input          # Python 2
except NameError:
    raw_input = input  # Python 3

# LED strip configuration:
LED_COUNT      = 8      # Number of LED pixels.
LED_PIN        = 18      # GPIO pin connected to the pixels (must support PWM!).
LED_FREQ_HZ    = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA        = 10      # DMA channel to use for generating signal (try 10)
LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
LED_INVERT     = False   # True to invert the signal (when using NPN transistor level shift)
LED_CHANNEL    = 0       # PWM channel
LED_GAMMA = [
0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2,
2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5,
6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 11, 11,
11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18,
19, 19, 20, 21, 21, 22, 22, 23, 23, 24, 25, 25, 26, 27, 27, 28,
29, 29, 30, 31, 31, 32, 33, 34, 34, 35, 36, 37, 37, 38, 39, 40,
40, 41, 42, 43, 44, 45, 46, 46, 47, 48, 49, 50, 51, 52, 53, 54,
55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
71, 72, 73, 74, 76, 77, 78, 79, 80, 81, 83, 84, 85, 86, 88, 89,
90, 91, 93, 94, 95, 96, 98, 99,100,102,103,104,106,107,109,110,
111,113,114,116,117,119,120,121,123,124,126,128,129,131,132,134,
135,137,138,140,142,143,145,146,148,150,151,153,155,157,158,160,
162,163,165,167,169,170,172,174,176,178,179,181,183,185,187,189,
191,193,194,196,198,200,202,204,206,208,210,212,214,216,218,220,
222,224,227,229,231,233,235,237,239,241,244,246,248,250,252,255]


LED_COUNT = max(0,int(sys.argv[1]))
WAIT_MS = max(0,int(sys.argv[2]))
MODE = sys.argv[3]
LED_BRIGHTNESS = min(255,int(max(0,float(sys.argv[4])) * 255 / 100))
if (sys.argv[5].lower() != "true"):
    LED_GAMMA = range(256)

def getRGBfromI(RGBint):
    blue =  RGBint & 255
    green = (RGBint >> 8) & 255
    red =   (RGBint >> 16) & 255
    return red, green, blue

# Define functions which animate LEDs in various ways.
def setPixel(strip, i, color):
    """Set a single pixel"""
    strip.setPixelColor(i, color)
    strip.show()

def setPixels(strip, s, e, color, wait_ms=30):
    """Set pixels from s(tart) to e(nd)"""
    if (wait_ms > 0):
        for i in range(s, e+1):
            strip.setPixelColor(i, color)
            strip.show()
            time.sleep(wait_ms/1000.0)
    else:
        for i in range(s, e+1):
            strip.setPixelColor(i, color)
        strip.show()

def setBrightness(strip, brightness, wait_ms=30):
    """Set overall brighness"""
    strip.setBrightness(brightness)
    strip.show()
    time.sleep(wait_ms/1000.0)

def colorWipe(strip, color, wait_ms=30):
    """Wipe color across display a pixel at a time."""
    if (wait_ms > 0):
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, color)
            strip.show()
            time.sleep(wait_ms/1000.0)
    else:
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, color)
        strip.show()

def shiftUp(strip, color, wait_ms=30):
    """Shift all pixels one way."""
    oldcolour = strip.getPixelColor(0)
    strip.setPixelColor(0, color)
    strip.show()
    if (wait_ms > 0):
        time.sleep(wait_ms/1000.0)
        for i in range(1,LED_COUNT):
            newcolour = oldcolour
            oldcolour = strip.getPixelColor(i)
            strip.setPixelColor(i, newcolour)
            strip.show()
            time.sleep(wait_ms/1000.0)
    else:
        for i in range(1,LED_COUNT):
            newcolour = oldcolour
            oldcolour = strip.getPixelColor(i)
            strip.setPixelColor(i, newcolour)
        strip.show()

def shiftDown(strip, color, wait_ms=30):
    """Shift all pixels the other way."""
    oldcolour = strip.getPixelColor(LED_COUNT-1)
    strip.setPixelColor(LED_COUNT-1, color)
    strip.show()
    if (wait_ms > 0):
        time.sleep(wait_ms/1000.0)
        for i in range(LED_COUNT-2,-1,-1):
            newcolour = oldcolour
            oldcolour = strip.getPixelColor(i)
            strip.setPixelColor(i, newcolour)
            strip.show()
            time.sleep(wait_ms/1000.0)
    else:
        for i in range(LED_COUNT-2,-1,-1):
            newcolour = oldcolour
            oldcolour = strip.getPixelColor(i)
            strip.setPixelColor(i, newcolour)
        strip.show()

def wheel(pos):
    """Generate rainbow colors across 0-255 positions."""
    if pos < 85:
        return Color(pos * 3, 255 - pos * 3, 0)
    elif pos < 170:
        pos -= 85
        return Color(255 - pos * 3, 0, pos * 3)
    else:
        pos -= 170
        return Color(0, pos * 3, 255 - pos * 3)

def rainbow(strip, wait_ms=20, iterations=2):
    """Draw rainbow that fades across all pixels at once."""
    for j in range(256*iterations):
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, wheel((i+j) & 255))
        strip.show()
        time.sleep(wait_ms/1000.0)

def rainbowCycle(strip, wait_ms=20, iterations=2):
    """Draw rainbow that uniformly distributes itself across all pixels."""
    for j in range(256*iterations):
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, wheel(((i * 256 / strip.numPixels()) + j) & 255))
        strip.show()
        time.sleep(wait_ms/1000.0)

# Main loop:
if __name__ == '__main__':
    # Create NeoPixel object with appropriate configuration.
    #strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS)
    if __version__ == "legacy":
        strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
    else:
        strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL, LED_GAMMA)# Intialize the library (must be called once before other functions).

    strip.begin()

    ## Color wipe animations.
    colorWipe(strip, Color(127, 0, 0), WAIT_MS)  # Red wipe
    colorWipe(strip, Color(0, 127, 0), WAIT_MS)  # Green wipe
    colorWipe(strip, Color(0, 0, 127), WAIT_MS)  # Blue wipe
    colorWipe(strip, Color(0, 0, 0), WAIT_MS)  # Off wipe

    ## Rainbow animations.
    #rainbow(strip)
    #rainbowCycle(strip)
    #colorWipe(strip, Color(0, 0, 0))  # Off wipe

    while True:
        try:
            data = raw_input()
            bits = data.split(',')
            if len(bits) == 2:
                if bits[0] == "brightness":
                    setBrightness(strip, min(255,max(0,int(bits[1]))), WAIT_MS)
            if len(bits) == 3:
                if MODE == "shiftu":
                    shiftUp(strip, Color(int(bits[0]), int(bits[1]), int(bits[2])), WAIT_MS)
                elif MODE == "shiftd":
                    shiftDown(strip, Color(int(bits[0]), int(bits[1]), int(bits[2])), WAIT_MS)
                else:
                    colorWipe(strip, Color(int(bits[0]), int(bits[1]), int(bits[2])), WAIT_MS)
            if (MODE[0] == 'p' and len(bits) == 4):
                setPixel(strip, int(bits[0]), Color(int(bits[1]), int(bits[2]), int(bits[3]) ))
            if (MODE[0] == 'p' and len(bits) == 5):
                setPixels(strip, int(bits[0]), int(bits[1]), Color(int(bits[2]), int(bits[3]), int(bits[4]) ), WAIT_MS)
        except (EOFError, SystemExit):  # hopefully always caused by us sigint'ing the program
            sys.exit(0)
        except Exception as ex:
            print("bad data: "+data)
            print(ex)
