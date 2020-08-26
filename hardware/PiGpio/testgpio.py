#!/usr/bin/python
import sys
try:
    import RPi.GPIO as GPIO
    sys.exit(0)
except ImportError:
    sys.exit(1)
