#!/usr/bin/python

# Python driver for SRF04 and SRO05 Ultrasonic sensors
# Modified to use PINS not BCM : Dave Conway-Jones

#import
import RPi.GPIO as GPIO
import time
import sys
import os, select
import signal

def signal_handler(sig, frame):
    sys.exit(0)
signal.signal(signal.SIGINT, signal_handler)

# Turn off warnings if you run it a second time...
GPIO.setwarnings(False)

ECHO    = 0
TRIGGER = 0
OLD = 0
SLEEP = 0.5
MAX_DIST = 400

def Measure():
    realstart = time.time()
    GPIO.output(TRIGGER, True)
    time.sleep(0.00001)
    GPIO.output(TRIGGER, False)
    start = time.time()
    stop = time.time()
    while GPIO.input(ECHO)==0:
        start = time.time()
        Dif = time.time() - realstart
        if Dif > 0.2:
            # print("Ultrasonic Sensor Timed out, Restart.")
            time.sleep(0.4)
            return 400
    while GPIO.input(ECHO)==1:
        stop = time.time()
        Dif = time.time() - realstart
        if Dif > 0.4:
            print("Ultrasonic Sensor Timed out, Restarting.")
            time.sleep(0.2)
            return 400

    elapsed = stop - start
    distance = (elapsed * 36000)/2
    return distance

# Main program loop
if len(sys.argv) > 1:
    pins = sys.argv[1].lower().split(',')
    if len(pins) != 3:
        print("Bad parameters supplied")
        print(pins)
        sys.exit(0)

    TRIGGER = int(pins[0])
    ECHO    = int(pins[1])
    SLEEP   = float(pins[2])

    GPIO.setmode(GPIO.BOARD)        # Use GPIO BOARD numbers
    GPIO.setup(TRIGGER, GPIO.OUT)   # Trigger
    GPIO.output(TRIGGER, False)
    GPIO.setup(ECHO, GPIO.OUT)      # Echo
    GPIO.output(ECHO, False)
    GPIO.setup(ECHO,GPIO.IN)

    # Flush stdin so we start clean
    while len(select.select([sys.stdin.fileno()], [], [], 0.0)[0])>0:
        os.read(sys.stdin.fileno(), 4096)

    while True:
        try:
            distance = int( Measure() + 0.5 )
            if distance != OLD and distance > 2 and distance < 400:
                print(distance)
                OLD = distance
            time.sleep(SLEEP)
        except:                     # try to clean up on exit
            print("0.0")

else:
    print("Bad params")
    print("    nrsrf.py trigger_pin, echo_pin, rate_in_seconds")
    sys.exit(0)
