#!/usr/bin/python
#
# HD44780 LCD Test Script for
# Raspberry Pi
#
# Original Author : Matt Hawkins
# Site   : http://www.raspberrypi-spy.co.uk
# Modified to use PINS not BCM : Dave Conway-Jones

#import
import RPi.GPIO as GPIO
import time
import sys
import os
import select

try:
    raw_input          # Python 2
except NameError:
    raw_input = input  # Python 3

# Turn off warnings if you run it a second time...
GPIO.setwarnings(False)

# Define initial Pins to LCD mapping
LCD_RS = 26
LCD_E  = 24
LCD_D4 = 22
LCD_D5 = 18
LCD_D6 = 16
LCD_D7 = 12

# Define some device constants
LCD_WIDTH = 20    # Maximum characters per line
LCD_CHR = True
LCD_CMD = False

LCD_LINE_1 = 0x80 # LCD RAM address for the 1st line
LCD_LINE_2 = 0xC0 # LCD RAM address for the 2nd line
LCD_LINE_3 = 0x94 # LCD RAM address for the 3rd line
LCD_LINE_4 = 0xD4 # LCD RAM address for the 4th line

# Timing constants
E_PULSE = 0.0005
E_DELAY = 0.0005

def lcd_init():
  # Initialise display
  lcd_byte(0x33,LCD_CMD)
  lcd_byte(0x32,LCD_CMD)
  lcd_byte(0x0C,LCD_CMD)
  lcd_byte(0x06,LCD_CMD)
  lcd_byte(0x28,LCD_CMD)
  lcd_byte(0x01,LCD_CMD)
  time.sleep(E_DELAY)

def lcd_string(message):
  # Send string to display
  message = message.ljust(LCD_WIDTH," ")
  for i in range(LCD_WIDTH):
    lcd_byte(ord(message[i]),LCD_CHR)

def lcd_byte(bits, mode):
  # Send byte to data pins
  # bits = data
  # mode = True  for character
  #        False for command
  GPIO.output(LCD_RS, mode) # RS

  # High bits
  GPIO.output(LCD_D4, False)
  GPIO.output(LCD_D5, False)
  GPIO.output(LCD_D6, False)
  GPIO.output(LCD_D7, False)
  if bits&0x10==0x10:
    GPIO.output(LCD_D4, True)
  if bits&0x20==0x20:
    GPIO.output(LCD_D5, True)
  if bits&0x40==0x40:
    GPIO.output(LCD_D6, True)
  if bits&0x80==0x80:
    GPIO.output(LCD_D7, True)

  # Toggle 'Enable' pin
  time.sleep(E_DELAY)
  GPIO.output(LCD_E, True)
  time.sleep(E_PULSE)
  GPIO.output(LCD_E, False)
  time.sleep(E_DELAY)

  # Low bits
  GPIO.output(LCD_D4, False)
  GPIO.output(LCD_D5, False)
  GPIO.output(LCD_D6, False)
  GPIO.output(LCD_D7, False)
  if bits&0x01==0x01:
    GPIO.output(LCD_D4, True)
  if bits&0x02==0x02:
    GPIO.output(LCD_D5, True)
  if bits&0x04==0x04:
    GPIO.output(LCD_D6, True)
  if bits&0x08==0x08:
    GPIO.output(LCD_D7, True)

  # Toggle 'Enable' pin
  time.sleep(E_DELAY)
  GPIO.output(LCD_E, True)
  time.sleep(E_PULSE)
  GPIO.output(LCD_E, False)
  time.sleep(E_DELAY)

# Main program loop
if len(sys.argv) > 1:
    pins = sys.argv[1].lower().split(',')
    if len(pins) != 6:
        print("Bad number of pins supplied")
        print("    "+pins)
        sys.exit(0)

    LCD_RS = int(pins[0])
    LCD_E  = int(pins[1])
    LCD_D4 = int(pins[2])
    LCD_D5 = int(pins[3])
    LCD_D6 = int(pins[4])
    LCD_D7 = int(pins[5])

    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BOARD)     # Use GPIO BOARD numbers
    GPIO.setup(LCD_RS, GPIO.OUT) # RS
    GPIO.setup(LCD_E,  GPIO.OUT) # E
    GPIO.setup(LCD_D4, GPIO.OUT) # DB4
    GPIO.setup(LCD_D5, GPIO.OUT) # DB5
    GPIO.setup(LCD_D6, GPIO.OUT) # DB6
    GPIO.setup(LCD_D7, GPIO.OUT) # DB7

    # Initialise display
    lcd_init()

    # Send some test
    lcd_byte(LCD_LINE_1, LCD_CMD)
    lcd_string("Node-RED")
    lcd_byte(LCD_LINE_2, LCD_CMD)
    lcd_string("LCD online")
    time.sleep(2) # 2 second delay
    lcd_byte(0x01,LCD_CMD)

    # Flush stdin so we start clean
    while len(select.select([sys.stdin.fileno()], [], [], 0.0)[0])>0:
        os.read(sys.stdin.fileno(), 4096)

    while True:
        try:
            data = raw_input()
            data = data.rstrip("\r\n\t")
            if data == "c:lose": # cleanup and exit
                GPIO.cleanup(LCD_RS)
                GPIO.cleanup(LCD_E)
                GPIO.cleanup(LCD_D4)
                GPIO.cleanup(LCD_D5)
                GPIO.cleanup(LCD_D6)
                GPIO.cleanup(LCD_D7)
                sys.exit(0)
            elif data == "clr:": # clear the display
                lcd_init()
            elif data.startswith("1:"):
                lcd_byte(LCD_LINE_1, LCD_CMD)
                lcd_string(data[2:])
            elif data.startswith("2:"):
                lcd_byte(LCD_LINE_2, LCD_CMD)
                lcd_string(data[2:])
            elif data.startswith("3:"):
                lcd_byte(LCD_LINE_3, LCD_CMD)
                lcd_string(data[2:])
            elif data.startswith("4:"):
                lcd_byte(LCD_LINE_4, LCD_CMD)
                lcd_string(data[2:])
            else:               # default to line 1
                lcd_byte(LCD_LINE_1, LCD_CMD)
                lcd_string(data)
        except EOFError:        # hopefully always caused by us sigint'ing the program
            GPIO.cleanup(LCD_RS)
            GPIO.cleanup(LCD_E)
            GPIO.cleanup(LCD_D4)
            GPIO.cleanup(LCD_D5)
            GPIO.cleanup(LCD_D6)
            GPIO.cleanup(LCD_D7)
            sys.exit(0)

else:
    print("Bad params")
    print("    sudo nrlcd.py RS,E,D4,D5,D6,D7")
    sys.exit(0)
