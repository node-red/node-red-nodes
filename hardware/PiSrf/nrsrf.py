#!/usr/bin/python

# Python driver for SRF04 and SRO05 Ultrasonic sensors
# Modified to use PINS not BCM : Dave Conway-Jones

#import
import RPi.GPIO as GPIO
import time
import sys
import os, select

# Turn off warnings if you run it a second time...
GPIO.setwarnings(False)

ECHO    = 0
TRIGGER = 0
OLD = 0

def Measure():
    start = 0
    realstart = 0
    realstart = time.time()
    GPIO.output(TRIGGER, True)
    time.sleep(0.00001)
    GPIO.output(TRIGGER, False)
    start = time.time()
    while GPIO.input(ECHO)==0:
        start = time.time()
        Dif = time.time() - realstart
        if Dif > 0.2:
            print("Ultrasonic Sensor Timed out, Restarting.")
            time.sleep(0.4)
            Main()
    while GPIO.input(ECHO)==1:
        stop = time.time()
    elapsed = stop-start
    distance = (elapsed * 36000)/2

    return distance


# Main program loop
if len(sys.argv) > 1:
    pins = sys.argv[1].lower().split(',')
    if len(pins) != 2:
        print "Bad number of pins supplied"
        print pins
        sys.exit(0)

    TRIGGER = int(pins[0])
    ECHO    = int(pins[1])

    GPIO.setmode(GPIO.BOARD)        # Use GPIO BOARD numbers
    GPIO.setup(TRIGGER, GPIO.OUT)   # Trigger
    GPIO.setup(ECHO, GPIO.OUT)      # Echo
    GPIO.output(ECHO, False)
    GPIO.setup(ECHO,GPIO.IN)

    # Flush stdin so we start clean
    while len(select.select([sys.stdin.fileno()], [], [], 0.0)[0])>0:
        os.read(sys.stdin.fileno(), 4096)

    while True:
        try:
            distance = int( Measure() + 0.5 )
            if distance != OLD:
                print(distance)
                OLD = distance
            time.sleep(0.5)
        except:                     # try to clean up on exit
            print("0.0");
            GPIO.cleanup(TRIGGER)
            GPIO.cleanup(ECHO)
            sys.exit(0)

else:
    print "Bad params"
    print "    sudo nrsrf.py trigger_pin,echo_pin"
    sys.exit(0)
