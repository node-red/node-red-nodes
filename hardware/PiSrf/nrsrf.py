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
SLEEP = 0.5

def Measure():
    start = 0
    GPIO.output(TRIGGER, True)
    time.sleep(0.00001)
    GPIO.output(TRIGGER, False)

    channel = GPIO.wait_for_edge(ECHO, GPIO.BOTH, timeout=200)
    if channel is None:
        print("Ultrasonic sensor timed out (pre-echo).")
        GPIO.remove_event_detect(ECHO)
        restart()
    # else:
        # print("Echo start detected")
    start = time.time()

    GPIO.wait_for_edge(ECHO, GPIO.BOTH,  timeout=400)
    if channel is None:
        print("Ultrasonic sensor timed out (post-echo).")
        GPIO.remove_event_detect(ECHO)
        restart()
    # else:
        # print("Echo finish detected")
    stop = time.time()

    elapsed = stop-start
    distance = (elapsed * 34300)/2 # Using speed of sound at 20C (68F)

    return distance

def restart():
    # print("Restarting...")
    GPIO.setmode(GPIO.BOARD)        # Use GPIO BOARD numbers
    GPIO.setup(TRIGGER, GPIO.OUT)   # Trigger
    GPIO.output(TRIGGER, False)     # Set low
    GPIO.setup(ECHO, GPIO.OUT)      # Echo
    GPIO.output(ECHO, False)
    time.sleep(0.1)
    GPIO.setup(ECHO,GPIO.IN)
    GPIO.add_event_detect(ECHO, GPIO.BOTH)
    time.sleep(2.0)

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

    restart()

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
        except Exception as e:		# try to clean up on exit
            print(e)			# Print error message on exception
            GPIO.remove_event_detect(ECHO)
            GPIO.cleanup(TRIGGER)
            GPIO.cleanup(ECHO)
            sys.exit(0)

else:
    print("Bad params")
    print("    sudo nrsrf.py trigger_pin,echo_pin,rate_in_seconds")
    sys.exit(0)
