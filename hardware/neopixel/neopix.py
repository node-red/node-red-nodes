#!/usr/bin/python

# Import library functions we need
import sys
import time
from neopixel import *

# LED strip configuration:
LED_COUNT      = 8      # Number of LED pixels.
LED_PIN        = 18      # GPIO pin connected to the pixels (must support PWM!).
LED_FREQ_HZ    = 800000  # LED signal frequency in hertz (usually 800khz)
LED_DMA        = 5       # DMA channel to use for generating signal (try 5)
LED_BRIGHTNESS = 255     # Set to 0 for darkest and 255 for brightest
LED_INVERT     = False   # True to invert the signal (when using NPN transistor level shift)

if sys.version_info >= (3,0):
    print("Sorry - currently only configured to work with python 2.x")
    sys.exit(1)

LED_COUNT = int(sys.argv[1])
WAIT_MS = int(sys.argv[2])
MODE = sys.argv[3]

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
    for i in range(s, e+1):
        strip.setPixelColor(i, color)
        strip.show()
        time.sleep(wait_ms/1000.0)

def colorWipe(strip, color, wait_ms=30):
    """Wipe color across display a pixel at a time."""
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
        strip.show()
        time.sleep(wait_ms/1000.0)

def shiftUp(strip, color, wait_ms=30):
    """Shift all pixels one way."""
    oldcolour = strip.getPixelColor(0)
    strip.setPixelColor(0, color)
    strip.show()
    time.sleep(wait_ms/1000.0)
    for i in range(1,LED_COUNT):
        newcolour = oldcolour
        oldcolour = strip.getPixelColor(i)
        strip.setPixelColor(i, newcolour)
        strip.show()
        time.sleep(wait_ms/1000.0)

def shiftDown(strip, color, wait_ms=30):
    """Shift all pixels the other way."""
    oldcolour = strip.getPixelColor(LED_COUNT-1)
    strip.setPixelColor(LED_COUNT-1, color)
    strip.show()
    time.sleep(wait_ms/1000.0)
    for i in range(LED_COUNT-2,-1,-1):
        newcolour = oldcolour
        oldcolour = strip.getPixelColor(i)
        strip.setPixelColor(i, newcolour)
        strip.show()
        time.sleep(wait_ms/1000.0)

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
    strip = Adafruit_NeoPixel(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS)
    # Intialize the library (must be called once before other functions).
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
            print "bad data: "+data
            print ex
